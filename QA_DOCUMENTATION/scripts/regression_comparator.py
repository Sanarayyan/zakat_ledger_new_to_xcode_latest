import argparse,json
def main():
 p=argparse.ArgumentParser(description="Compare test status across two execution runs.")
 p.add_argument("previous");p.add_argument("current");a=p.parse_args()
 old=json.load(open(a.previous,encoding="utf-8"));new=json.load(open(a.current,encoding="utf-8"))
 def idx(d):return {x.get("test_id"):x.get("status") for x in d.get("results",[])}
 x,y=idx(old),idx(new)
 print(f"Previous run: {old.get('run_id','unknown')} | Current run: {new.get('run_id','unknown')}")
 for tid in sorted(set(x)|set(y)):
  before=x.get(tid,"ABSENT");after=y.get(tid,"ABSENT")
  if before!=after:
   label="NEW FAILURE" if after=="FAIL" and before!="FAIL" else "RESOLVED" if before=="FAIL" and after=="PASS" else "CHANGED"
   print(f"{label}: {tid}: {before} -> {after}")
 print("NOTE: Status comparison does not establish root cause or prove equivalent test conditions.")
if __name__=="__main__":main()
