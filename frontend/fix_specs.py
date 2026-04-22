import os
import re

def fix_signals_in_specs():
    files_to_fix = [
        'src/app/components/workflow-stepper.component.spec.ts'
    ]
    
    # Pattern: component.status = DossierStatus.SOMETHING;
    # Replacement: fixture.componentRef.setInput('status', DossierStatus.SOMETHING);
    
    patterns = [
        (re.compile(r"component\.status\s*=\s*(DossierStatus\.\w+|null);"), r"fixture.componentRef.setInput('status', \1);"),
    ]

    for rel_path in files_to_fix:
        path = rel_path
        if not os.path.exists(path):
            print(f"Skipping {path}, not found.")
            continue
            
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = content
        for pattern, replacement in patterns:
            new_content = pattern.sub(replacement, new_content)
        
        if new_content != content:
            print(f"Fixed signals in {path}")
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_content)
        else:
            print(f"No changes needed for {path}")

if __name__ == "__main__":
    fix_signals_in_specs()
