import re
import sys

def parse_failures(log_file):
    for encoding in ['utf-16', 'utf-16-le', 'utf-8', 'latin-1']:
        try:
            with open(log_file, 'r', encoding=encoding) as f:
                content = f.read()
                if content:
                    print(f"Successfully decoded with {encoding}")
                    break
        except Exception:
            continue
    else:
        print("Failed to decode with any standard encoding")
        return []
    
    failures = []
    
    # New regex to catch failures in Karma logs
    # It usually looks like: Chrome 147.0.0.0 (Windows 10) Spec Name FAILED
    # followed by indentation and error
    
    parts = re.split(r' FAILED\n', content)
    
    for i in range(len(parts) - 1):
        # Look backwards from the end of parts[i] to find the START of the test name
        # The line typically starts with "Chrome 147.0.0.0 (Windows 10)"
        header_text = parts[i]
        # Find the last occurrence of "Chrome"
        last_chrome = header_text.rfind('Chrome ')
        if last_chrome != -1:
            name_line = header_text[last_chrome:]
            # Remove the "Chrome ... (Windows 10) " prefix
            name = re.sub(r'Chrome .*? \(Windows 10\) ', '', name_line).strip()
        else:
            name = header_text.split('\n')[-1].strip()
        
        # The error is at the start of parts[i+1]
        error_text = parts[i+1]
        # Error typically ends when the next "Chrome" line starts or "Executed" line
        error_match = re.search(r'(.*?)(?=Chrome .*? \(Windows 10\)|TOTAL:|\Z)', error_text, re.DOTALL)
        error = error_match.group(1).strip() if error_match else "Unknown error"
        
        failures.append((name, error))
        
    return failures

if __name__ == "__main__":
    log_file = sys.argv[1] if len(sys.argv) > 1 else 'test_results_4.log'
    failures = parse_failures(log_file)
    print(f"Total Unique Failures found: {len(failures)}")
    # Use a set to de-duplicate multiple runs of same test if they appeared
    unique_failures = {}
    for name, error in failures:
        if name not in unique_failures:
            unique_failures[name] = error.split('\n')[0]
            
    for name, error_summary in sorted(unique_failures.items()):
        print(f"- {name}: {error_summary}")
