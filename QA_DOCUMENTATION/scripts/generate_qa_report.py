import argparse,json,collections,pathlib
def main():
 p=argparse.ArgumentParser(description="Generate Markdown execution report from results JSON.")
 p.add_argument("results");p.add_argument("--out",default="TEST_EXECUTION_REPORT.md");a=p.parse_args()
 d=json.load(open(a.results,encoding="utf-8")); rows=d.get("results",[])
 counts=collections.Counter(x.get("status","UNKNOWN") for x in rows)
 lines=["# Test Execution Report","",f"- Suite version: {d.get('suite_version','Unknown')}",f"- Run ID: {d.get('run_id','Unknown')}",f"- App build: {d.get('environment',{}).get('app_build','Unknown')}",f"- Platform: {d.get('environment',{}).get('platform','Unknown')}","","## Summary","","| Status | Count |","|---|---:|"]
 for s in ["PASS","FAIL","BLOCKED","INCONCLUSIVE","NOT_RUN","SKIPPED","NEEDS_REQUIREMENT_CLARIFICATION"]: lines.append(f"| {s} | {counts.get(s,0)} |")
 lines += ["","## Test results","","| Test ID | Status | Actual result | Evidence |","|---|---|---|---|"]
 for x in rows:
  actual=str(x.get("actual_result","")).replace("|","\\|").replace("\n"," ")
  ev=", ".join(x.get("evidence",[])).replace("|","\\|")
  lines.append(f"| {x.get('test_id','')} | {x.get('status','')} | {actual} | {ev} |")
 lines += ["","","Generated from structured results. Confirm evidence and environment before release decisions."]
 out=pathlib.Path(a.out);out.parent.mkdir(parents=True,exist_ok=True);out.write_text("\n".join(lines),encoding="utf-8")
 print(f"Wrote {out}; {len(rows)} test records.")
if __name__=="__main__":main()
