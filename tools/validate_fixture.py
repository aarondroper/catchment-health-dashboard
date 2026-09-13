#!/usr/bin/env python3
"""CLI wrapper for validating the checked-in contract fixture."""

from __future__ import annotations

import pathlib
import sys


# Keep the repository-local command usable before the package is installed.
REPOSITORY_ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(REPOSITORY_ROOT) not in sys.path:
    sys.path.insert(0, str(REPOSITORY_ROOT))

from catchment_dashboard.contracts import main


if __name__ == "__main__":
    raise SystemExit(main())
