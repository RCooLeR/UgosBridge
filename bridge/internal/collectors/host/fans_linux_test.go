//go:build linux

package hostcollector

import (
	"os"
	"path/filepath"
	"slices"
	"strings"
	"testing"

	"github.com/RCooLeR/UgosBridge/bridge/internal/model"
)

func TestCollectSensorsUGOSFanFallback(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  []model.SensorSnapshot
	}{
		{
			name:  "confirmed NAS readings",
			input: "cpufan speed:3125\nsysfan1 speed:2288\nsysfan2 speed:2280\n",
			want: []model.SensorSnapshot{
				ugosFanTestSensor("cpufan", "CPU Fan", 3125),
				ugosFanTestSensor("sysfan1", "System Fan 1", 2288),
				ugosFanTestSensor("sysfan2", "System Fan 2", 2280),
			},
		},
		{
			name:  "whitespace CRLF and zero RPM",
			input: " \tcpufan\t speed : 0 \r\n\tsysfan1 speed: 2288\r\n  sysfan2 speed:2280 ",
			want: []model.SensorSnapshot{
				ugosFanTestSensor("cpufan", "CPU Fan", 0),
				ugosFanTestSensor("sysfan1", "System Fan 1", 2288),
				ugosFanTestSensor("sysfan2", "System Fan 2", 2280),
			},
		},
		{
			name:  "unnumbered system fan",
			input: "sysfan speed:1250\n",
			want:  []model.SensorSnapshot{ugosFanTestSensor("sysfan", "System Fan", 1250)},
		},
		{
			name:  "duplicate identities",
			input: "cpufan speed:3125\ncpufan speed:3999\nsysfan1 speed:2288\nsysfan1 speed:2999\n",
			want: []model.SensorSnapshot{
				ugosFanTestSensor("cpufan", "CPU Fan", 3125),
				ugosFanTestSensor("sysfan1", "System Fan 1", 2288),
			},
		},
		{
			name: "invalid lines do not suppress valid readings",
			input: strings.Join([]string{
				"",
				"cpufan speed:unavailable",
				"cpufan speed:-1",
				"cpufan speed:9223372036854775808",
				"cpufan speed:18446744073709551616",
				"cpufan speed:3125.5",
				"cpufan speed:NaN",
				"cpufan speed:Inf",
				"cpufan speed:",
				"cpufan speed:3125 rpm",
				"cpufan speed:3125:0",
				"cpufan speed 3125",
				"cpufan temperature:50",
				"other speed:900",
				"sysfanx speed:900",
				"sysfan1 extra speed:900",
				"cpufan speed:3125",
			}, "\n"),
			want: []model.SensorSnapshot{ugosFanTestSensor("cpufan", "CPU Fan", 3125)},
		},
		{
			name:  "empty source",
			input: "\n \t\r\n",
		},
		{
			name:  "oversized source is discarded including valid prefix",
			input: "cpufan speed:3125\n" + strings.Repeat("x", 20*1024),
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			collector := newFanTestCollector(t)
			writeFanTestFile(t, filepath.Join(collector.cfg.ProcFS, "it86", "fan"), tt.input)

			got := collector.collectSensors()
			if !slices.Equal(got, tt.want) {
				t.Fatalf("collectSensors() = %+v, want %+v", got, tt.want)
			}
		})
	}
}

func TestCollectSensorsUGOSFansRefreshEachCollection(t *testing.T) {
	collector := newFanTestCollector(t)
	path := filepath.Join(collector.cfg.ProcFS, "it86", "fan")
	for _, sample := range []struct {
		input string
		rpm   float64
	}{
		{input: "cpufan speed:3125\n", rpm: 3125},
		{input: "cpufan speed:3139\n", rpm: 3139},
	} {
		writeFanTestFile(t, path, sample.input)
		want := []model.SensorSnapshot{ugosFanTestSensor("cpufan", "CPU Fan", sample.rpm)}
		if got := collector.collectSensors(); !slices.Equal(got, want) {
			t.Fatalf("collectSensors() = %+v, want current sample %+v", got, want)
		}
	}
	if err := os.Remove(path); err != nil {
		t.Fatalf("remove fan fixture: %v", err)
	}
	if got := collector.collectSensors(); len(got) != 0 {
		t.Fatalf("collectSensors() after source disappears = %+v, want no stale sensors", got)
	}
}

func TestCollectSensorsUGOSFansPreserveTemperatures(t *testing.T) {
	collector := newFanTestCollector(t)
	writeFanTestFile(t, filepath.Join(collector.cfg.ProcFS, "it86", "fan"), "cpufan speed:3125\n")
	writeFanTestFile(t, filepath.Join(collector.cfg.SysFS, "class", "hwmon", "hwmon0", "name"), "coretemp\n")
	writeFanTestFile(t, filepath.Join(collector.cfg.SysFS, "class", "hwmon", "hwmon0", "temp1_input"), "45000\n")
	writeFanTestFile(t, filepath.Join(collector.cfg.SysFS, "class", "thermal", "thermal_zone0", "type"), "x86_pkg_temp\n")
	writeFanTestFile(t, filepath.Join(collector.cfg.SysFS, "class", "thermal", "thermal_zone0", "temp"), "46000\n")

	want := []model.SensorSnapshot{
		{Source: "hwmon", Chip: "coretemp", Name: "temp1", Label: "temp1", Kind: "temperature", DeviceType: "host", Value: 45},
		ugosFanTestSensor("cpufan", "CPU Fan", 3125),
		{Source: "thermal", Chip: "x86_pkg_temp", Name: "thermal_zone0", Label: "x86_pkg_temp", Kind: "temperature", DeviceType: "host", Value: 46},
	}
	if got := collector.collectSensors(); !slices.Equal(got, want) {
		t.Fatalf("collectSensors() = %+v, want %+v", got, want)
	}
}

func TestCollectSensorsUGOSFanSourceUnavailable(t *testing.T) {
	for _, sourceIsDirectory := range []bool{false, true} {
		name := "missing"
		if sourceIsDirectory {
			name = "unreadable directory"
		}
		t.Run(name, func(t *testing.T) {
			collector := newFanTestCollector(t)
			if sourceIsDirectory {
				if err := os.MkdirAll(filepath.Join(collector.cfg.ProcFS, "it86", "fan"), 0o755); err != nil {
					t.Fatalf("create invalid fan source: %v", err)
				}
			}
			writeFanTestFile(t, filepath.Join(collector.cfg.SysFS, "class", "hwmon", "hwmon0", "name"), "coretemp\n")
			writeFanTestFile(t, filepath.Join(collector.cfg.SysFS, "class", "hwmon", "hwmon0", "temp1_input"), "45000\n")

			want := []model.SensorSnapshot{{Source: "hwmon", Chip: "coretemp", Name: "temp1", Label: "temp1", Kind: "temperature", DeviceType: "host", Value: 45}}
			if got := collector.collectSensors(); !slices.Equal(got, want) {
				t.Fatalf("collectSensors() = %+v, want %+v", got, want)
			}
		})
	}
}

func TestCollectSensorsHwmonFanPrecedence(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  []model.SensorSnapshot
	}{
		{
			name:  "valid hwmon fan suppresses proc source",
			input: "1500\n",
			want:  []model.SensorSnapshot{{Source: "hwmon", Chip: "it87", Name: "fan1", Label: "CPU Fan", Kind: "fan", DeviceType: "host", Value: 1500}},
		},
		{
			name:  "stopped hwmon fan suppresses proc source",
			input: "0\n",
			want:  []model.SensorSnapshot{{Source: "hwmon", Chip: "it87", Name: "fan1", Label: "CPU Fan", Kind: "fan", DeviceType: "host", Value: 0}},
		},
		{
			name:  "negative hwmon reading allows fallback",
			input: "-1\n",
			want:  []model.SensorSnapshot{ugosFanTestSensor("cpufan", "CPU Fan", 3125), ugosFanTestSensor("sysfan1", "System Fan 1", 2288)},
		},
		{
			name:  "malformed hwmon reading allows fallback",
			input: "unavailable\n",
			want:  []model.SensorSnapshot{ugosFanTestSensor("cpufan", "CPU Fan", 3125), ugosFanTestSensor("sysfan1", "System Fan 1", 2288)},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			collector := newFanTestCollector(t)
			writeFanTestFile(t, filepath.Join(collector.cfg.ProcFS, "it86", "fan"), "cpufan speed:3125\nsysfan1 speed:2288\n")
			hwmonPath := filepath.Join(collector.cfg.SysFS, "class", "hwmon", "hwmon0")
			writeFanTestFile(t, filepath.Join(hwmonPath, "name"), "it87\n")
			writeFanTestFile(t, filepath.Join(hwmonPath, "fan1_label"), "CPU Fan\n")
			writeFanTestFile(t, filepath.Join(hwmonPath, "fan1_input"), tt.input)

			if got := collector.collectSensors(); !slices.Equal(got, tt.want) {
				t.Fatalf("collectSensors() = %+v, want %+v", got, tt.want)
			}
		})
	}
}

func newFanTestCollector(t *testing.T) *Collector {
	t.Helper()
	root := t.TempDir()
	return &Collector{cfg: Config{ProcFS: filepath.Join(root, "proc"), SysFS: filepath.Join(root, "sys")}}
}

func writeFanTestFile(t *testing.T, path string, content string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatalf("create fixture directory: %v", err)
	}
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatalf("write fixture: %v", err)
	}
}

func ugosFanTestSensor(name string, label string, rpm float64) model.SensorSnapshot {
	return model.SensorSnapshot{Source: "ugos", Chip: "it86", Name: name, Label: label, Kind: "fan", DeviceType: "host", Value: rpm}
}
