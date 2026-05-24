//go:build linux

package hostcollector

import "testing"

func TestBuildUPSSnapshotFromNUTValues(t *testing.T) {
	ups := buildUPSSnapshot("ups@localhost", map[string]string{
		"device.mfr":            "APC",
		"device.model":          "Back-UPS",
		"device.serial":         "ABC123",
		"ups.status":            "OL CHRG",
		"battery.charge":        "97",
		"battery.runtime":       "2450",
		"battery.voltage":       "27.1",
		"input.voltage":         "229.4",
		"output.voltage":        "230.1",
		"ups.load":              "18",
		"ups.realpower":         "54",
		"ups.realpower.nominal": "300",
		"input.frequency":       "50.0",
		"ups.temperature":       "31.2",
	})

	if ups.Name != "ups" || ups.Manufacturer != "APC" || ups.Model != "Back-UPS" || ups.Serial != "ABC123" {
		t.Fatalf("unexpected UPS identity: %#v", ups)
	}
	if !ups.Online || ups.OnBattery || ups.LowBattery {
		t.Fatalf("unexpected UPS status flags: online=%v on_battery=%v low_battery=%v", ups.Online, ups.OnBattery, ups.LowBattery)
	}
	if ups.BatteryChargePercent != 97 || !ups.BatteryChargeAvailable {
		t.Fatalf("battery charge = %v available=%v, want 97 true", ups.BatteryChargePercent, ups.BatteryChargeAvailable)
	}
	if ups.BatteryRuntimeSeconds != 2450 || !ups.BatteryRuntimeAvailable {
		t.Fatalf("battery runtime = %v available=%v, want 2450 true", ups.BatteryRuntimeSeconds, ups.BatteryRuntimeAvailable)
	}
	if ups.BatteryVoltage != 27.1 || !ups.BatteryVoltageAvailable {
		t.Fatalf("battery voltage = %v available=%v, want 27.1 true", ups.BatteryVoltage, ups.BatteryVoltageAvailable)
	}
	if ups.RealPowerWatts != 54 || !ups.RealPowerWattsAvailable {
		t.Fatalf("real power = %v available=%v, want 54 true", ups.RealPowerWatts, ups.RealPowerWattsAvailable)
	}
}

func TestBuildUPSSnapshotDetectsBatteryStatus(t *testing.T) {
	ups := buildUPSSnapshot("rackups", map[string]string{
		"ups.status": "OB LB DISCHRG",
	})

	if ups.Name != "rackups" {
		t.Fatalf("UPS name = %q, want rackups", ups.Name)
	}
	if ups.Online || !ups.OnBattery || !ups.LowBattery {
		t.Fatalf("unexpected UPS status flags: online=%v on_battery=%v low_battery=%v", ups.Online, ups.OnBattery, ups.LowBattery)
	}
}

func TestBuildUPSSnapshotNormalizesScaledBatteryVoltage(t *testing.T) {
	ups := buildUPSSnapshot("ups0@localhost", map[string]string{
		"battery.voltage":         "1.3",
		"battery.voltage.nominal": "1.2",
		"input.voltage":           "224",
		"output.voltage":          "20",
	})

	if !ups.BatteryVoltageAvailable || ups.BatteryVoltage != 13 {
		t.Fatalf("battery voltage = %v available=%v, want 13 true", ups.BatteryVoltage, ups.BatteryVoltageAvailable)
	}
	if !ups.InputVoltageAvailable || ups.InputVoltage != 224 {
		t.Fatalf("input voltage = %v available=%v, want 224 true", ups.InputVoltage, ups.InputVoltageAvailable)
	}
	if ups.OutputVoltageAvailable {
		t.Fatalf("output voltage should be unavailable, got %v", ups.OutputVoltage)
	}
}
