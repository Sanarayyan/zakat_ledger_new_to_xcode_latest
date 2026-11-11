import argparse,pathlib,datetime
def main():
 p=argparse.ArgumentParser(description="Create a Markdown index of evidence files.")
 p.add_argument("directory");p.add_argument("--out",default="EVIDENCE_INDEX.md");a=p.parse_args()
 root=pathlib.Path(a.directory)
 if not root.exists(): print(f"Evidence directory does not exist: {root}");return 2
 files=sorted(x for x in root.rglob("*") if x.is_file())
 lines=["# Evidence Index","",f"Generated: {datetime.datetime.now().astimezone().isoformat()}","","| File | Size (bytes) |","|---|---:|"]
 for f in files: lines.append(f"| `{f.as_posix()}` | {f.stat().st_size} |")
 out=pathlib.Path(a.out);out.parent.mkdir(parents=True,exist_ok=True);out.write_text("\n".join(lines),encoding="utf-8")
 print(f"Indexed {len(files)} files into {out}")
if __name__=="__main__":raise SystemExit(main())
