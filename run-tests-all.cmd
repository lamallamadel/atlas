@echo off
REM ============================================
REM Complete Backend E2E Test Suite
REM Runs both H2 and PostgreSQL profiles
REM Target: Zero failures across all tests
REM ============================================

setlocal enabledelayedexpansion

echo ============================================
echo Complete Backend E2E Test Suite
echo ============================================
echo This will run:
echo   1. H2 Profile (target: ^<5 minutes)
echo   2. PostgreSQL Profile (target: ^<15 minutes)
echo.
echo Total expected time: ~15-20 minutes
echo ============================================
echo.

pause

REM Track overall start time
set OVERALL_START=%time%

REM ============================================
REM Run H2 Tests
REM ============================================

echo.
echo ============================================
echo [1/2] Running H2 Profile Tests
echo ============================================
echo.

call "%~dp0run-tests-h2.cmd"
set H2_EXIT_CODE=%errorlevel%

if %H2_EXIT_CODE% equ 0 (
    echo [SUCCESS] H2 tests passed
) else (
    echo [FAILURE] H2 tests failed with exit code: %H2_EXIT_CODE%
)

echo.
echo Press any key to continue to PostgreSQL tests...
pause >nul

REM ============================================
REM Run PostgreSQL Tests
REM ============================================

echo.
echo ============================================
echo [2/2] Running PostgreSQL Profile Tests
echo ============================================
echo.

call "%~dp0run-tests-postgres.cmd"
set POSTGRES_EXIT_CODE=%errorlevel%

if %POSTGRES_EXIT_CODE% equ 0 (
    echo [SUCCESS] PostgreSQL tests passed
) else (
    echo [FAILURE] PostgreSQL tests failed with exit code: %POSTGRES_EXIT_CODE%
)

REM ============================================
REM Summary Report
REM ============================================

set OVERALL_END=%time%

echo.
echo ============================================
echo Test Suite Execution Summary
echo ============================================
echo Start time:  %OVERALL_START%
echo End time:    %OVERALL_END%
echo.
echo Results:
echo   H2 Profile:         %H2_EXIT_CODE% (0=passed)
echo   PostgreSQL Profile: %POSTGRES_EXIT_CODE% (0=passed)
echo.

REM Determine overall status
set OVERALL_STATUS=PASSED
if %H2_EXIT_CODE% neq 0 set OVERALL_STATUS=FAILED
if %POSTGRES_EXIT_CODE% neq 0 set OVERALL_STATUS=FAILED

if "%OVERALL_STATUS%"=="PASSED" (
    echo [SUCCESS] ALL TESTS PASSED! ✓
    echo.
    echo Coverage report: backend\target\site\jacoco\index.html
    echo Test reports:    backend\target\surefire-reports\
    echo.
    set EXIT_CODE=0
) else (
    echo [FAILURE] SOME TESTS FAILED! ✗
    echo.
    echo Please review:
    echo   - Test reports:    backend\target\surefire-reports\
    echo   - Coverage report: backend\target\site\jacoco\index.html
    echo   - Console output above for error details
    echo.
    set EXIT_CODE=1
)

echo ============================================
echo.

if "%OVERALL_STATUS%"=="PASSED" (
    echo Opening coverage report...
    start "" "backend\target\site\jacoco\index.html"
)

pause
exit /b %EXIT_CODE%
