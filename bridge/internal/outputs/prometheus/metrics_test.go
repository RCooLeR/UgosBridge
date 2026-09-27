package prometheusoutput

import (
	"reflect"
	"testing"

	"github.com/prometheus/client_golang/prometheus"

	"github.com/RCooLeR/UgosBridge/bridge/internal/model"
)

func TestUGOSFansExportDistinctRPMSeriesIncludingStoppedFan(t *testing.T) {
	registry := prometheus.NewRegistry()
	metrics := NewMetrics(registry)
	sensors := []model.SensorSnapshot{
		{Source: "ugos", Chip: "it86", Name: "cpufan", Label: "CPU Fan", Kind: "fan", Value: 3125, DeviceType: "host"},
		{Source: "ugos", Chip: "it86", Name: "sysfan1", Label: "System Fan 1", Kind: "fan", Value: 2288, DeviceType: "host"},
		{Source: "ugos", Chip: "it86", Name: "sysfan2", Label: "System Fan 2", Kind: "fan", Value: 0, DeviceType: "host"},
	}
	metrics.Update(model.Snapshot{Host: &model.HostSnapshot{Name: "dxp6800_pro", Sensors: sensors}}, nil)

	families, err := registry.Gather()
	if err != nil {
		t.Fatalf("gather metrics: %v", err)
	}
	for _, family := range families {
		if family.GetName() != "ugos_bridge_host_fan_speed_rpm" {
			continue
		}
		if len(family.Metric) != len(sensors) {
			t.Fatalf("fan series count = %d, want %d", len(family.Metric), len(sensors))
		}
		for _, sensor := range sensors {
			wantLabels := map[string]string{
				"host": "dxp6800_pro", "sensor": sensor.Name, "chip": "it86",
				"label": sensor.Label, "source": "ugos", "device_type": "host", "device": "",
			}
			found := false
			for _, metric := range family.Metric {
				labels := make(map[string]string)
				for _, label := range metric.Label {
					labels[label.GetName()] = label.GetValue()
				}
				if reflect.DeepEqual(labels, wantLabels) {
					found = true
					if got := metric.GetGauge().GetValue(); got != sensor.Value {
						t.Errorf("%s RPM = %v, want %v", sensor.Name, got, sensor.Value)
					}
				}
			}
			if !found {
				t.Errorf("missing fan series with labels %v", wantLabels)
			}
		}
		return
	}
	t.Fatal("fan RPM metric family was not exported")
}

func TestVMMemoryUsageBytesIgnoresStoppedVMs(t *testing.T) {
	running := model.VirtualMachineSnapshot{
		Running:          true,
		MemoryBytes:      8 * 1024,
		MemoryUsageBytes: 3 * 1024,
	}
	if got := vmMemoryUsageBytes(running); got != 3*1024 {
		t.Fatalf("running VM used memory = %d, want %d", got, 3*1024)
	}

	stopped := model.VirtualMachineSnapshot{
		Running:          false,
		MemoryBytes:      8 * 1024,
		MemoryUsageBytes: 3 * 1024,
	}
	if got := vmMemoryUsageBytes(stopped); got != 0 {
		t.Fatalf("stopped VM used memory = %d, want 0", got)
	}
}
