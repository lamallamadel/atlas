#!/bin/bash

# Jasypt Secret Encryption Utility
# Usage: ./encrypt-secret.sh "your-secret-value"

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <secret-to-encrypt>"
    echo ""
    echo "Example: $0 myApiKey123"
    exit 1
fi

SECRET_VALUE="$1"

if [ -z "$JASYPT_ENCRYPTOR_PASSWORD" ]; then
    echo "Error: JASYPT_ENCRYPTOR_PASSWORD environment variable not set"
    echo ""
    echo "Set it with: export JASYPT_ENCRYPTOR_PASSWORD='your-encryption-password'"
    echo "Generate a secure password with: openssl rand -base64 32"
    exit 1
fi

JASYPT_VERSION="1.9.3"
JASYPT_JAR="jasypt-${JASYPT_VERSION}.jar"

if [ ! -f "$JASYPT_JAR" ]; then
    echo "Downloading Jasypt ${JASYPT_VERSION}..."
    curl -L "https://repo1.maven.org/maven2/org/jasypt/jasypt/${JASYPT_VERSION}/${JASYPT_JAR}" -o "$JASYPT_JAR"
fi

echo ""
echo "Encrypting secret..."
echo ""

java -cp "$JASYPT_JAR" org.jasypt.intf.cli.JasyptPBEStringEncryptionCLI \
    input="$SECRET_VALUE" \
    password="$JASYPT_ENCRYPTOR_PASSWORD" \
    algorithm=PBEWITHHMACSHA512ANDAES_256 \
    ivGeneratorClassName=org.jasypt.iv.RandomIvGenerator

echo ""
echo "Use in application.yml as: ENC(encrypted_value_above)"
echo ""
