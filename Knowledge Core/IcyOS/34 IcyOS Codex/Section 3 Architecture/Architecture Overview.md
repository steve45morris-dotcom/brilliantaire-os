# 🏛️ Architecture Overview
IcyOS utilizes a modular mono-repo architecture. All boundary calls must flow down: apps/web -> packages/services -> packages/database -> packages/shared.
