package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/RCooLeR/UgosBridge/bridge/internal/model"
	cli "github.com/urfave/cli/v3"
)

func TestPreferredHostName(t *testing.T) {
	t.Run("uses override when configured", func(t *testing.T) {
		got := preferredHostName("cf9daa96a680", "ugreen-nas")
		if got != "ugreen-nas" {
			t.Fatalf("preferredHostName() = %q, want %q", got, "ugreen-nas")
		}
	})

	t.Run("keeps collected hostname when override is empty", func(t *testing.T) {
		got := preferredHostName("ugreen-nas", "   ")
		if got != "ugreen-nas" {
			t.Fatalf("preferredHostName() = %q, want %q", got, "ugreen-nas")
		}
	})
}

func TestParseCSV(t *testing.T) {
	got := parseCSV(" eth.*, bond.*, ,^enp[0-9]+ ")
	want := []string{"eth.*", "bond.*", "^enp[0-9]+"}

	if len(got) != len(want) {
		t.Fatalf("parseCSV() len = %d, want %d", len(got), len(want))
	}
	for idx := range want {
		if got[idx] != want[idx] {
			t.Fatalf("parseCSV()[%d] = %q, want %q", idx, got[idx], want[idx])
		}
	}
}

func TestParseNameOverrides(t *testing.T) {
	got, err := parseNameOverrides("ugos-id-1:Windows 11, ugos-id-2:Ubuntu Server")
	if err != nil {
		t.Fatalf("parseNameOverrides() error = %v", err)
	}
	if got["ugos-id-1"] != "Windows 11" || got["ugos-id-2"] != "Ubuntu Server" {
		t.Fatalf("parseNameOverrides() = %#v", got)
	}

	if _, err := parseNameOverrides("missing-colon"); err == nil {
		t.Fatalf("parseNameOverrides() error = nil, want error")
	}
}

func TestNormalizeProcessSort(t *testing.T) {
	cases := map[string]string{
		"":       "cpu",
		"mem":    "memory",
		"memory": "memory",
		"time":   "time",
		"name":   "name",
		"weird":  "cpu",
	}

	for input, want := range cases {
		if got := normalizeProcessSort(input); got != want {
			t.Fatalf("normalizeProcessSort(%q) = %q, want %q", input, got, want)
		}
	}
}

func TestSortProcesses(t *testing.T) {
	processes := []model.ProcessSnapshot{
		{Name: "Docker", CPUPercent: 12, MemoryBytes: 1024, CPUTimeSeconds: 50},
		{Name: "Sync & Backup", CPUPercent: 35, MemoryBytes: 512, CPUTimeSeconds: 20},
		{Name: "Virtual Machine", CPUPercent: 12, MemoryBytes: 4096, CPUTimeSeconds: 80},
	}

	got := sortProcesses(processes, "cpu")
	if got[0].Name != "Sync & Backup" || got[1].Name != "Virtual Machine" || got[2].Name != "Docker" {
		t.Fatalf("sortProcesses(cpu) order = %q, %q, %q", got[0].Name, got[1].Name, got[2].Name)
	}

	got = sortProcesses(processes, "memory")
	if got[0].Name != "Virtual Machine" || got[2].Name != "Sync & Backup" {
		t.Fatalf("sortProcesses(memory) order = %q, %q, %q", got[0].Name, got[1].Name, got[2].Name)
	}
}

func TestConfigFromCLI_DetailedContainerStats(t *testing.T) {
	t.Run("defaults to false", func(t *testing.T) {
		cfg := mustConfigFromArgs(t)
		if cfg.DetailedContainerStats {
			t.Fatalf("DetailedContainerStats = true, want false")
		}
	})

	t.Run("can be enabled with flag", func(t *testing.T) {
		cfg := mustConfigFromArgs(t, "--detailed-container-stats")
		if !cfg.DetailedContainerStats {
			t.Fatalf("DetailedContainerStats = false, want true")
		}
	})
}

func TestConfigFromCLI_MQTTProcessAllowlist(t *testing.T) {
	cfg := mustConfigFromArgs(t, "--mqtt-process-allowlist", "Search Serv,dockerd")
	if len(cfg.MQTTProcessAllowlist) != 2 || cfg.MQTTProcessAllowlist[0] != "Search Serv" || cfg.MQTTProcessAllowlist[1] != "dockerd" {
		t.Fatalf("MQTTProcessAllowlist = %#v", cfg.MQTTProcessAllowlist)
	}
}

func TestConfigFromCLIUsesOrderedEnvironmentSources(t *testing.T) {
	t.Setenv("LISTEN_ADDRESS", ":1111")
	t.Setenv("UGOS_BRIDGE_LISTEN_ADDRESS", ":2222")

	cfg := mustConfigFromArgs(t)
	if cfg.ListenAddress != ":1111" {
		t.Fatalf("ListenAddress = %q, want first configured environment source", cfg.ListenAddress)
	}
}

func TestPollCountUsesAtLeastTwoPolls(t *testing.T) {
	if got := pollCount(45*time.Second, 15*time.Second); got != 3 {
		t.Fatalf("pollCount(45s, 15s) = %d, want 3", got)
	}
	if got := pollCount(5*time.Second, 15*time.Second); got != 2 {
		t.Fatalf("pollCount(5s, 15s) = %d, want minimum 2", got)
	}
}

func TestLegacyExpireAfterFlagSetsEntityGrace(t *testing.T) {
	cfg := mustConfigFromArgs(t, "--homeassistant-expire-after", "60s")
	if cfg.HomeAssistantEntityGrace != time.Minute {
		t.Fatalf("HomeAssistantEntityGrace = %s, want 1m", cfg.HomeAssistantEntityGrace)
	}
}

func TestHealthcheckCommand(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))
	defer server.Close()

	cmd := buildHealthcheckCommand()
	if err := cmd.Run(t.Context(), []string{"healthcheck", "--url", server.URL, "--timeout", "1s"}); err != nil {
		t.Fatalf("healthcheck command failed: %v", err)
	}
}

func TestCheckHealthRejectsUnhealthyResponse(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		http.Error(w, "unhealthy", http.StatusServiceUnavailable)
	}))
	defer server.Close()

	if err := checkHealth(t.Context(), server.URL, time.Second); err == nil {
		t.Fatal("checkHealth() error = nil, want unhealthy status error")
	}
}

func TestCheckHealthValidatesTimeout(t *testing.T) {
	if err := checkHealth(t.Context(), "http://127.0.0.1/healthz", 0); err == nil {
		t.Fatal("checkHealth() error = nil, want timeout validation error")
	}
}

func mustConfigFromArgs(t *testing.T, args ...string) config {
	t.Helper()

	var cfg config
	cmd := &cli.Command{
		Name:  "test",
		Flags: buildFlags(),
		Action: func(_ context.Context, cmd *cli.Command) error {
			var err error
			cfg, err = configFromCLI(cmd)
			return err
		},
	}
	if err := cmd.Run(context.Background(), append([]string{"test"}, args...)); err != nil {
		t.Fatalf("run command: %v", err)
	}
	return cfg
}
