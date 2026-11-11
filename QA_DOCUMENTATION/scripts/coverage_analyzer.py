import argparse,json,sys
def main():
 p=argparse.ArgumentParser(description="Compare supplied feature inventory with test-case mappings.")
 p.add_argument("inventory");p.add_argument("cases");args=p.parse_args()
 try:
  inv=json.load(open(args.inventory,encoding="utf-8")); suite=json.load(open(args.cases,encoding="utf-8"))
 except Exception as e: print("ERROR:",e);return 2
 features=inv.get("features",[]); mapped={c.get("feature_id") for c in suite.get("cases",[])}
 covered=[f for f in features if f.get("id") in mapped]; missing=[f for f in features if f.get("id") not in mapped]
 pct=(len(covered)/len(features)*100) if features else 0
 print(f"Inventory features: {len(features)}")
 print(f"Features mapped to >=1 test: {len(covered)}")
 print(f"Mapped coverage: {pct:.1f}%")
 for f in missing: print(f"MISSING: {f.get('id')} — {f.get('name','(unnamed)')}")
 print("NOTE: This measures only supplied inventory and mappings; it does not prove discovery completeness.")
 return 0
if __name__=="__main__":sys.exit(main())
