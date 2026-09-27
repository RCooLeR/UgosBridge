//go:build linux

package hostcollector

import (
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"

	"github.com/RCooLeR/UgosBridge/bridge/internal/model"
)

const maxUGOSFanBytes = 16 * 1024

var ugosFanLinePattern = regexp.MustCompile(`^(cpufan|sysfan[0-9]*)\s+speed\s*:\s*([0-9]+)$`)

// collectUGOSFanSensors reads the optional vendor interface through the existing
// host procfs mount. Missing or unreadable telemetry must not fail host collection.
func (c *Collector) collectUGOSFanSensors() []model.SensorSnapshot {
	file, err := os.Open(filepath.Join(c.cfg.ProcFS, "it86", "fan"))
	if err != nil {
		return nil
	}
	defer file.Close()

	data, err := io.ReadAll(io.LimitReader(file, maxUGOSFanBytes+1))
	if err != nil || len(data) > maxUGOSFanBytes {
		return nil
	}

	var sensors []model.SensorSnapshot
	seen := make(map[string]bool)
	for line := range strings.SplitSeq(string(data), "\n") {
		match := ugosFanLinePattern.FindStringSubmatch(strings.TrimSpace(line))
		if match == nil {
			continue
		}
		name := match[1]
		rpm, err := strconv.ParseInt(match[2], 10, 64)
		if err != nil || seen[name] {
			continue
		}
		seen[name] = true

		label := "CPU Fan"
		if name != "cpufan" {
			label = "System Fan"
			if number := strings.TrimPrefix(name, "sysfan"); number != "" {
				label += " " + number
			}
		}
		sensors = append(sensors, model.SensorSnapshot{
			Name:       name,
			Label:      label,
			Chip:       "it86",
			Source:     "ugos",
			Kind:       "fan",
			Value:      float64(rpm),
			DeviceType: "host",
		})
	}
	return sensors
}
