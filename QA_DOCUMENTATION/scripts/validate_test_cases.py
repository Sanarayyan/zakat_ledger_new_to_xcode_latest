import argparse, json, re, sys
VALID_PRIORITIES = {"P0","P1","P2","P3"}
VALID_TYPES = {"ui","e2e","api","integration","unit","accessibility","visual","security","performance","mobile"}
def main():
    p=argparse.ArgumentParser(description="Validate QA test-case JSON.")
    p.add_argument("file"); args=p.parse_args()
    try: data=json.load(open(args.file,encoding="utf-8"))
    except Exception as e: print(f"ERROR: cannot read JSON: {e}"); return 2
    errors=[]; warnings=[]
    if not isinstance(data,dict): errors.append("Root must be an object.")
    else:
        for key in ("suite_version","app","cases"):
            if key not in data: errors.append(f"Missing root field: {key}")
        ids=set()
        for i,c in enumerate(data.get("cases",[]) if isinstance(data.get("cases",[]),list) else []):
            where=f"cases[{i}]"
            for key in ("id","title","feature_id","priority","type","preconditions","steps","expected_result"):
                if key not in c: errors.append(f"{where}: missing {key}")
            cid=c.get("id","")
            if cid in ids: errors.append(f"{where}: duplicate ID {cid}")
            ids.add(cid)
            if cid and not re.match(r"^[A-Z]+-[A-Z0-9_-]+-\d{3,}$",cid): warnings.append(f"{where}: non-standard ID {cid}")
            if c.get("priority") not in VALID_PRIORITIES: errors.append(f"{where}: invalid priority")
            if c.get("type") not in VALID_TYPES: errors.append(f"{where}: invalid type")
            if not c.get("steps"): errors.append(f"{where}: steps must not be empty")
            if not c.get("expected_result"): errors.append(f"{where}: expected_result must not be empty")
            if any(len(str(x).strip())<3 for x in c.get("expected_result",[])): warnings.append(f"{where}: vague/short expected result")
    for w in warnings: print("WARNING:",w)
    for e in errors: print("ERROR:",e)
    print(f"Cases: {len(data.get('cases',[])) if isinstance(data,dict) else 0}; errors: {len(errors)}; warnings: {len(warnings)}")
    return 1 if errors else 0
if __name__=="__main__": sys.exit(main())
