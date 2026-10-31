import argparse
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

PROJECT_ROOT = Path(__file__).resolve().parents[1]
COMPONENT = PROJECT_ROOT / "custom_components" / "gyverlamp2"


def build_release(output_dir: Path) -> Path:
    frontend = COMPONENT / "frontend" / "gyverlamp2.js"
    if not frontend.is_file() or frontend.stat().st_size == 0:
        raise SystemExit("Build the frontend first: cd frontend && npm ci && npm run build")
    version = json.loads((COMPONENT / "manifest.json").read_text())["version"]
    output_dir.mkdir(parents=True, exist_ok=True)
    archive = output_dir / f"gyverlamp2-{version}.zip"
    with ZipFile(archive, "w", ZIP_DEFLATED) as bundle:
        for source in sorted(COMPONENT.rglob("*")):
            if source.is_file() and source.suffix in {".py", ".json", ".yaml", ".js"}:
                bundle.write(source, source.relative_to(PROJECT_ROOT))
    return archive


def main() -> None:
    parser = argparse.ArgumentParser(description="Package the integration with its built frontend")
    parser.add_argument("--output", type=Path, default=PROJECT_ROOT / "dist")
    args = parser.parse_args()
    print(build_release(args.output))


if __name__ == "__main__":
    main()
