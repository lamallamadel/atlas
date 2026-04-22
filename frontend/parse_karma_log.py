import sys

def parse_karma_log(filename):
    lines = []
    try:
        with open(filename, 'r', encoding='utf-16', errors='ignore') as f:
            lines = f.readlines()
    except Exception:
        with open(filename, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
    
    if not lines:
        print("No lines read from file.")
        return

    failures = []
    for i, line in enumerate(lines):
        line = line.strip()
        # Look for lines ending with FAILED that are NOT periodic updates
        if line.endswith(' FAILED') and 'Executed' not in line:
            test_name = line.replace(' FAILED', '').strip()
            # Try to remove browser prefix (usually ends with ')')
            last_paren = test_name.rfind(')')
            if last_paren != -1:
                test_name = test_name[last_paren+1:].strip()
            
            error_details = []
            for j in range(i + 1, min(i + 15, len(lines))):
                if 'Executed' in lines[j] or 'FAILED' in lines[j]:
                    break
                error_details.append(lines[j].strip())
            failures.append((test_name, "\n".join(error_details)))
            
    print(f"Total Unique Failures found: {len(failures)}")
    seen = set()
    for name, error in failures:
        if name not in seen:
            print(f"--- FAILED: {name} ---")
            print(error)
            print("-" * 40)
            seen.add(name)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        parse_karma_log(sys.argv[1])
    else:
        print("Usage: python parse_karma_log.py <logfile>")
