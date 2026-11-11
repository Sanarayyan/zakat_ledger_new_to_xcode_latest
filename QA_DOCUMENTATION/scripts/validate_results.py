import argparse,json,sys
VALID={"NOT_RUN","PASS","FAIL","BLOCKED","INCONCLUSIVE","SKIPPED","NEEDS_REQUIREMENT_CLARIFICATION"}
def main():
 p=argparse.ArgumentParser(description="Validate execution results against a test suite.")
 p.add_argument("cases");p.add_argument("results");a=p.parse_args()
 try: c=json.load(open(a.cases,encoding="utf-8"));r=json.load(open(a.results,encoding="utf-8"))
 except Exception as e: print("ERROR:",e);return 2
 known={x.get("id") for x in c.get("cases",[])}; seen=set();errors=[]
 for x in r.get("results",[]):
  tid=x.get("test_id")
  if tid not in known: errors.append(f"Unknown test ID: {tid}")
  if tid in seen: errors.append(f"Duplicate result: {tid}")
  seen.add(tid)
  if x.get("status") not in VALID: errors.append(f"{tid}: invalid status")
 missing=known-seen
 for tid in sorted(missing): errors.append(f"Missing execution result: {tid}")
 if c.get("suite_version")!=r.get("suite_version"): errors.append("Suite version mismatch.")
 for e in errors: print("ERROR:",e)
 print(f"Known tests: {len(known)}; results: {len(seen)}; issues: {len(errors)}")
 return 1 if errors else 0
if __name__=="__main__":sys.exit(main())
