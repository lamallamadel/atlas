#!/usr/bin/env python3
import subprocess
import os
import sys

# Set Java 17 path
JAVA17_HOME = r'C:\Environement\Java\jdk-17.0.5.8-hotspot'
MAVEN_HOME = r'C:\Environement\maven-3.8.6'

# Set environment
env = os.environ.copy()
env['JAVA_HOME'] = JAVA17_HOME
env['PATH'] = f"{JAVA17_HOME}\\bin;{MAVEN_HOME}\\bin;{env['PATH']}"

print(f'Using Java 17 from: {env["JAVA_HOME"]}')
print()

# Change to backend directory
os.chdir('backend')

try:
    print('Running: mvn clean install -DskipTests -gs settings.xml')
    print('This may take several minutes...')
    print()
    
    result = subprocess.run(
        ['mvn', 'clean', 'install', '-DskipTests', '-gs', 'settings.xml'],
        env=env,
        check=True
    )
    
    print()
    print('Backend setup completed successfully!')
    sys.exit(0)
except subprocess.CalledProcessError as e:
    print()
    print('Backend setup failed!')
    print(f'Error: {e}')
    sys.exit(1)
