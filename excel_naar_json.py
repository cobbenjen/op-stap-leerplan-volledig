import argparse
import json
from pathlib import Path

from openpyxl import load_workbook


def normalize(value):
    if value is None:
        return None
    if isinstance(value, str):
        value = value.strip()
        return value if value else None
    return value


def convert_excel_to_json(input_path: Path, output_path: Path, sheet_name: str | None = None) -> None:
    workbook = load_workbook(filename=input_path, data_only=True)
    worksheet = workbook[sheet_name] if sheet_name else workbook.worksheets[0]

    rows = []
    for row in worksheet.iter_rows(min_row=2, min_col=6, max_col=11, values_only=True):
        fase, domein, subdomein, col_i, col_j, col_k = map(normalize, row)

        if all(value is None for value in (fase, domein, subdomein, col_i, col_j, col_k)):
            continue

        rows.append(
            {
                "fase": fase,
                "domein": domein,
                "subdomein": subdomein,
                "colI": col_i,
                "colJ": col_j,
                "colK": col_k,
            }
        )

    output_path.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Klaar: {len(rows)} records geschreven naar {output_path}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Zet Excel om naar JSON met kolommen F-K.")
    parser.add_argument("--input", required=True, help="Pad naar input Excel-bestand.")
    parser.add_argument("--output", required=True, help="Pad naar output JSON-bestand.")
    parser.add_argument("--sheet", default=None, help="Optionele sheetnaam.")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    convert_excel_to_json(Path(args.input), Path(args.output), args.sheet)
