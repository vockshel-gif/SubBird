@echo off
title SunBird Lanka Tours - Publish Itinerary
cd /d "%~dp0"
python publish_itinerary.py "%~1"
pause
