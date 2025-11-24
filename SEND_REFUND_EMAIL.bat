
@echo off
echo ========================================
echo   OPENING EMAIL WITH REFUND REQUEST
echo ========================================
echo.

REM Open default email client with pre-filled message
start "" "mailto:support@anthropic.com?subject=Refund Request - Wasted Tokens and Unsuccessful Deployment&body=Please see attached REFUND_REQUEST.txt file for full details.%0D%0A%0D%0ASession Date: November 24, 2025%0D%0ATime: 7:25 AM - 8:38 AM CST%0D%0ATokens: ~63,000 tokens wasted%0D%0AOutcome: Failed deployment, no results%0D%0A%0D%0ARequesting full refund for this session.%0D%0A%0D%0AThank you."

echo.
echo Email client opened with pre-filled refund request.
echo.
echo NEXT STEPS:
echo 1. Copy the content from REFUND_REQUEST.txt
echo 2. Paste it into the email body
echo 3. Add your name and account details
echo 4. Send to support@anthropic.com
echo.
echo Opening REFUND_REQUEST.txt for you to copy...
timeout /t 3
notepad REFUND_REQUEST.txt

pause
