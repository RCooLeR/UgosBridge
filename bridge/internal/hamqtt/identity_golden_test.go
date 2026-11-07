package hamqtt

import (
	"flag"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/RCooLeR/UgosBridge/bridge/internal/model"
)

var updateGolden = flag.Bool("update", false, "rewrite testdata golden files")

// identitySnapshot covers every entity family the publisher emits.
func identitySnapshot() model.Snapshot {
	return model.Snapshot{
		CollectedAt: time.Date(2026, 11, 7, 12, 0, 0, 0, time.UTC),
		Projects: []model.ProjectSnapshot{
			{Name: "ugos-bridge", CPUPercent: 0.5, MemoryUsageBytes: 2048, TotalContainers: 1, RunningContainers: 1},
		},
		Containers: []model.ContainerSnapshot{
			{ID: "0123456789abcdef", Name: "ugos-bridge", Project: "ugos-bridge", Image: "rcooler/ugos-bridge:1.0.7", State: "running", Status: "Up 2 hours", Running: true, CPUPercent: 0.5, MemoryUsageBytes: 2048, MemoryLimitBytes: 4096},
		},
		Host: &model.HostSnapshot{
			Name: "DXP6800 Pro",
			CPU: model.HostCPUSnapshot{
				UsagePercent: 12.5, CurrentMHz: 2400, Load1: 1.25, UptimeSeconds: 3600,
				CoreUsage: []model.CPUCoreSnapshot{{Name: "cpu0", UsagePercent: 10, CurrentMHz: 2400, MinMHz: 800, MaxMHz: 4400, Governor: "powersave"}},
			},
			Memory: model.HostMemorySnapshot{UsedBytes: 40, TotalBytes: 100, FreeBytes: 60, SwapUsedBytes: 1, SwapTotalBytes: 10},
			Filesystems: []model.FilesystemSnapshot{
				{Name: "/", Path: "/rootfs", Source: "/dev/root", FSType: "ext4", TotalBytes: 100, UsedBytes: 50, FreeBytes: 50},
				{Name: "/volume1", Path: "/volume1", Source: "/dev/md0", FSType: "btrfs", Array: "md0", TotalBytes: 1000, UsedBytes: 400, FreeBytes: 600},
			},
			Disks: []model.DiskSnapshot{
				{Name: "sda", Path: "/sys/devices/pci0000:00/ata1/sda", Model: "WDC", Vendor: "ATA", Serial: "WD-123", Type: "hdd", SizeBytes: 4000},
				{Name: "nvme0n1", Path: "/sys/devices/pci0000:00/nvme/nvme0/nvme0n1", Model: "Samsung", Type: "nvme", SizeBytes: 1000},
			},
			Arrays: []model.ArraySnapshot{
				{Name: "md0", Level: "raid1", State: "clean", SizeBytes: 1000, DisksTotal: 2, DisksActive: 2, Members: []string{"sda1", "sdb1"}, Mountpoints: []string{"/volume1"}},
			},
			Networks: []model.NetworkSnapshot{
				{Name: "eth0", Master: "bond0", MAC: "00:11:22:33:44:55", OperState: "up", Duplex: "full", SpeedMbps: 1000, MTU: 1500, Carrier: true, RxBytesPerSec: 10, TxBytesPerSec: 20},
				{Name: "eth2", OperState: "down", Carrier: false},
			},
			Bonds: []model.BondSnapshot{
				{Name: "bond0", Mode: "active-backup", ActiveSlave: "eth0", MIIStatus: "up", OperState: "up", SpeedMbps: 1000, Carrier: true,
					Slaves: []model.BondSlaveSnapshot{{Name: "eth0", MIIStatus: "up", OperState: "up", Duplex: "full", SpeedMbps: 1000, Carrier: true, Active: true}}},
			},
			GPUs: []model.GPUSnapshot{
				{Name: "card0", Driver: "i915", Vendor: "0x8086", Device: "0x46d1", CardPath: "/sys/class/drm/card0", BusyPercent: 3, BusyAvailable: true, CurrentMHz: 300, MaxMHz: 1450, BoostMHz: 1450},
			},
			Sensors: []model.SensorSnapshot{
				{Name: "temp1", Label: "Package id 0", Chip: "coretemp", Source: "hwmon", Kind: "temperature", Value: 45, DeviceType: "host"},
				{Name: "fan1", Label: "cpufan", Chip: "it86", Source: "ugos", Kind: "fan", Value: 1200, DeviceType: "host"},
				{Name: "temp1", Label: "Composite", Chip: "nvme", Source: "hwmon", Kind: "temperature", Value: 38, DeviceType: "disk", DeviceName: "nvme0n1"},
				{Name: "thermal_zone0", Label: "cpul_thermal_zone", Chip: "cpul_thermal_zone", Source: "thermal", Kind: "temperature", Value: 50, DeviceType: "host"},
			},
			Cooling: []model.CoolingDeviceSnapshot{
				{Name: "cooling_device0", Type: "Processor", CurState: 1, MaxState: 4, Percent: 25},
				{Name: "cooling_device1", Type: "Fan", CurState: 0, MaxState: 0},
			},
			UPSs: []model.UPSSnapshot{
				{Name: "ups", Model: "Back-UPS", Manufacturer: "APC", Status: "OL", Online: true, BatteryChargePercent: 100, BatteryChargeAvailable: true},
			},
			Processes: []model.ProcessSnapshot{
				{Name: "dockerd", ProcessCount: 1, CPUPercent: 1.5, MemoryBytes: 1024, CPUTimeSeconds: 10},
			},
			VMs: []model.VirtualMachineSnapshot{
				{UGOSVMID: "ugos-vm-1", Name: "Windows 11", State: "running", Running: true, VCPUs: 4, CPUPercent: 5, MemoryBytes: 8192, MemoryUsageBytes: 4096, MaxMemoryBytes: 8192},
			},
		},
	}
}

// identityPublishes runs one full availability replay and returns every
// publish as a sorted "topic<TAB>retained<TAB>payload" line.
func identityPublishes(t *testing.T, publisher *Publisher, client *recordingClient, snapshot model.Snapshot) []string {
	t.Helper()

	publisher.beginAvailabilityReplay(client)
	if err := publisher.PublishSnapshot(snapshot); err != nil {
		t.Fatalf("PublishSnapshot returned error: %v", err)
	}

	lines := make([]string, 0, len(client.publishes))
	for _, message := range client.publishes {
		lines = append(lines, message.topic+"\t"+strconv.FormatBool(message.retained)+"\t"+message.payload)
	}
	sort.Strings(lines)
	return lines
}

// TestGlobalScopeIdentityGolden pins every topic, retained flag and payload of
// the default (global) identity scope. Existing installations depend on these
// exact discovery topics, unique IDs, device IDs and state topics; regenerate
// the golden file only for a deliberate, migrated identity change.
func TestGlobalScopeIdentityGolden(t *testing.T) {
	client := &recordingClient{connectionOpen: true}
	publisher := &Publisher{
		client: client,
		cfg: Config{
			ClientID:         "ugos_bridge",
			TopicPrefix:      "ugos_bridge",
			DiscoveryPrefix:  "homeassistant",
			QoS:              1,
			Retain:           true,
			ProcessAllowlist: []string{"dockerd"},
		},
		availabilityTopic:  "ugos_bridge/status",
		availabilityOnline: "online_golden",
		discoveredEntities: map[string]publishedEntity{},
		lastPayloads:       map[string]string{},
		preparedPayloads:   map[string]preparedPayload{},
	}

	got := strings.Join(identityPublishes(t, publisher, client, identitySnapshot()), "\n") + "\n"
	path := filepath.Join("testdata", "global_scope.golden")
	if *updateGolden {
		if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(path, []byte(got), 0o644); err != nil {
			t.Fatal(err)
		}
	}

	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read golden file (run with -update to create it): %v", err)
	}
	want := strings.ReplaceAll(string(raw), "\r\n", "\n")
	if got == want {
		return
	}

	gotLines := strings.Split(got, "\n")
	wantLines := strings.Split(want, "\n")
	for index := 0; index < len(gotLines) || index < len(wantLines); index++ {
		var gotLine, wantLine string
		if index < len(gotLines) {
			gotLine = gotLines[index]
		}
		if index < len(wantLines) {
			wantLine = wantLines[index]
		}
		if gotLine != wantLine {
			t.Fatalf("global identity scope changed at line %d:\n got: %s\nwant: %s", index+1, gotLine, wantLine)
		}
	}
}
