import subprocess
import os

# Set Java 17 environment
env = os.environ.copy()
env['JAVA_HOME'] = r'C:\Environement\Java\jdk-17.0.5.8-hotspot'
env['PATH'] = r'C:\Environement\Java\jdk-17.0.5.8-hotspot\bin;' + env['PATH']

# Run Maven
result = subprocess.run(
    ['mvn', 'clean', 'install', '-DskipTests', '-f', 'backend\\pom.xml'],
    env=env,
    capture_output=False
)

exit(result.returncode)
