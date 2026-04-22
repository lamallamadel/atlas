import os
import re
import glob

def get_signals_for_file(filepath):
    """Parses a component file to find input() and viewChild() signals."""
    inputs = set()
    view_children = set()
    
    if not os.path.exists(filepath):
        return inputs, view_children
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Improved regex to handle optional type parameters: input.required<Type>(...)
    input_pattern = re.compile(r"(?:readonly\s+)?(\w+)\s*=\s*input(?:\.required)?(?:\s*<[^>]+>)?\s*\(", re.MULTILINE)
    for m in input_pattern.findall(content):
        inputs.add(m)
        
    # Improved regex for viewChild with optional types
    view_child_pattern = re.compile(r"(?:readonly\s+)?(\w+)\s*=\s*viewChild(?:\.required)?(?:\s*<[^>]+>)?\s*\(", re.MULTILINE)
    for m in view_child_pattern.findall(content):
        view_children.add(m)
        
    return inputs, view_children

def migrate_spec(spec_path, inputs, view_children):
    """Refactors a spec file to use the correct Signal testing APIs."""
    with open(spec_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    
    # Standard prefix (handle leading whitespace too)
    for prop in inputs:
        # Match component.prop = val; or testComponent.prop = val;
        # Handling different assignment values and objects
        pattern = re.compile(rf"((?:component|testComponent|fixture\.componentInstance)\.{prop})\s*=\s*(.*?);", re.DOTALL)
        
        # replacement function to handle proper back-referencing
        def input_replace(match):
            prefix = match.group(1)
            val = match.group(2)
            # determine if fixture is likely available
            # In most cases it is 'fixture.componentRef'
            return f"fixture.componentRef.setInput('{prop}', {val});"

        new_content = pattern.sub(input_replace, new_content)

    for prop in view_children:
        pattern = re.compile(rf"((?:component|testComponent|fixture\.componentInstance)\.{prop})\s*=\s*(.*?);", re.DOTALL)
        def vc_replace(match):
            prefix = match.group(1)
            instance = prefix.split('.')[0]
            val = match.group(2)
            return f"Object.defineProperty({instance}, '{prop}', {{ value: () => {val} }});"
            
        new_content = pattern.sub(vc_replace, new_content)

    if new_content != content:
        with open(spec_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

def main():
    root_dir = 'src/app'
    spec_files = glob.glob(os.path.join(root_dir, '**/*.spec.ts'), recursive=True)
    
    print(f"Scanning {len(spec_files)} spec files...")
    migration_count = 0
    for spec_path in spec_files:
        component_path = spec_path.replace('.spec.ts', '.ts')
        
        if not os.path.exists(component_path):
            continue
            
        inputs, view_children = get_signals_for_file(component_path)
        
        if not inputs and not view_children:
            continue
            
        if migrate_spec(spec_path, inputs, view_children):
            print(f"Migrated signals in: {spec_path}")
            migration_count += 1
            
    print(f"\nMigration complete. Updated {migration_count} spec files.")

if __name__ == "__main__":
    main()
