//go:build linux

package hostcollector

import (
	"testing"
	"time"

	"github.com/RCooLeR/UgosBridge/bridge/internal/model"
)

func TestSmoothTemperatureSensorsAveragesRecentSamples(t *testing.T) {
	collector := &Collector{
		cfg: Config{TemperatureAverageWindow: 2 * time.Minute},
	}
	now := time.Date(2026, 5, 14, 12, 0, 0, 0, time.UTC)
	sensors := []model.SensorSnapshot{temperatureSensor(40)}

	collector.smoothTemperatureSensors(now, sensors)
	if sensors[0].Value != 40 {
		t.Fatalf("first temperature = %v, want 40", sensors[0].Value)
	}

	sensors[0].Value = 80
	collector.smoothTemperatureSensors(now.Add(time.Minute), sensors)
	if sensors[0].Value != 60 {
		t.Fatalf("averaged temperature = %v, want 60", sensors[0].Value)
	}

	sensors[0].Value = 50
	collector.smoothTemperatureSensors(now.Add(3*time.Minute+30*time.Second), sensors)
	if sensors[0].Value != 50 {
		t.Fatalf("expired-window temperature = %v, want 50", sensors[0].Value)
	}
}

func TestSmoothTemperatureSensorsLeavesFansRaw(t *testing.T) {
	collector := &Collector{
		cfg: Config{TemperatureAverageWindow: 2 * time.Minute},
	}
	sensors := []model.SensorSnapshot{{
		Source: "hwmon",
		Chip:   "fanctl",
		Name:   "fan1",
		Label:  "Fan 1",
		Kind:   "fan",
		Value:  1200,
	}}

	collector.smoothTemperatureSensors(time.Date(2026, 5, 14, 12, 0, 0, 0, time.UTC), sensors)
	if sensors[0].Value != 1200 {
		t.Fatalf("fan value = %v, want 1200", sensors[0].Value)
	}
}

func temperatureSensor(value float64) model.SensorSnapshot {
	return model.SensorSnapshot{
		Source: "hwmon",
		Chip:   "coretemp",
		Name:   "temp1",
		Label:  "Package id 0",
		Kind:   "temperature",
		Value:  value,
	}
}
