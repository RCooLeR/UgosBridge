//go:build linux

package hostcollector

import (
	"os"
	"path/filepath"
	"testing"
)

func TestResolveHostnameUsesStableConfiguredSources(t *testing.T) {
	override := &Collector{cfg: Config{HostnameOverride: " DXP6800 Pro "}}
	if got, err := override.resolveHostname(); err != nil || got != "DXP6800 Pro" {
		t.Fatalf("override hostname = %q, %v", got, err)
	}

	hostnamePath := filepath.Join(t.TempDir(), "hostname")
	if err := os.WriteFile(hostnamePath, []byte("nas-host\n"), 0o600); err != nil {
		t.Fatalf("write hostname: %v", err)
	}
	fromFile := &Collector{cfg: Config{HostnamePath: hostnamePath}}
	if got, err := fromFile.resolveHostname(); err != nil || got != "nas-host" {
		t.Fatalf("file hostname = %q, %v", got, err)
	}
}

func TestResolveHostnameDoesNotUseContainerHostnameFallback(t *testing.T) {
	collector := &Collector{cfg: Config{
		HostnamePath: filepath.Join(t.TempDir(), "missing-hostname"),
		ProcFS:       filepath.Join(t.TempDir(), "missing-proc"),
	}}

	if hostname, err := collector.resolveHostname(); err == nil {
		t.Fatalf("resolveHostname returned container-dependent hostname %q", hostname)
	}
}
