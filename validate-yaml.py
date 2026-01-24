import yaml
import sys

files_to_validate = [
    'backend/src/main/resources/application-dev.yml',
    'backend/src/main/resources/application-prod.yml',
    'backend/src/main/resources/application-staging.yml',
    'backend/src/main/resources/application-e2e-h2-mock.yml',
    'backend/src/main/resources/application-e2e-h2-keycloak.yml',
    'backend/src/main/resources/application-e2e-postgres-mock.yml',
    'backend/src/main/resources/application-e2e-postgres-keycloak.yml',
]

all_valid = True
for file_path in files_to_validate:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            yaml.safe_load(f)
        print(f'✓ {file_path}: Valid YAML')
    except yaml.YAMLError as e:
        print(f'✗ {file_path}: Invalid YAML')
        print(f'  Error: {e}')
        all_valid = False
    except FileNotFoundError:
        print(f'✗ {file_path}: File not found')
        all_valid = False

if all_valid:
    print('\n✓ All YAML files are syntactically valid')
    sys.exit(0)
else:
    print('\n✗ Some YAML files have errors')
    sys.exit(1)
