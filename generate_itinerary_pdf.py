import os
import json
import time
import tempfile
import subprocess
import shutil
import base64
import requests
import simple_websocket

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
ARTIFACT_DIR = r"C:\Users\vikum\.gemini\antigravity\brain\150b8c0a-446e-41da-be7a-1ebab2abe59a"
os.makedirs(ARTIFACT_DIR, exist_ok=True)
os.makedirs("scratch", exist_ok=True)

def render_template(input_html, output_pdf_paths, screenshot_prefix, port=9440):
    user_data = tempfile.mkdtemp()
    file_url = f"file:///{os.path.abspath(input_html).replace(os.sep, '/')}"

    cmd = [
        CHROME_PATH,
        "--headless=new",
        f"--user-data-dir={user_data}",
        f"--remote-debugging-port={port}",
        "--window-size=1200,4500",
        "--disable-gpu",
        "--allow-file-access-from-files",
        file_url
    ]
    proc = subprocess.Popen(cmd)
    try:
        tabs = []
        for _ in range(30):
            try:
                tabs = requests.get(f"http://127.0.0.1:{port}/json", timeout=1).json()
                if tabs: break
            except:
                time.sleep(0.3)
        page_tab = next((t for t in tabs if t.get("type") == "page"), tabs[0])
        ws = simple_websocket.Client(page_tab["webSocketDebuggerUrl"])
        msg_id = 1
        def send_cmd(method, params=None):
            nonlocal msg_id
            c = {"id": msg_id, "method": method, "params": params or {}}
            msg_id += 1
            ws.send(json.dumps(c))
            while True:
                res = json.loads(ws.receive())
                if res.get("id") == c["id"]: return res

        time.sleep(2.5)

        # Hide floating elements for clean screenshot
        send_cmd("Runtime.evaluate", {
            "expression": """
                document.querySelectorAll('.edit-tip-banner, .floating-pdf-actions').forEach(el => el.style.display = 'none');
            """
        })

        # Print to PDF
        pdf_params = {
            "paperWidth": 8.27,
            "paperHeight": 11.69,
            "marginTop": 0,
            "marginBottom": 0,
            "marginLeft": 0,
            "marginRight": 0,
            "printBackground": True,
            "preferCSSPageSize": True,
            "generateTaggedPDF": True
        }
        pdf_res = send_cmd("Page.printToPDF", pdf_params)
        pdf_data = base64.b64decode(pdf_res["result"]["data"])
        for out_path in output_pdf_paths:
            with open(out_path, "wb") as f:
                f.write(pdf_data)
            print(f"Generated {out_path} ({len(pdf_data)} bytes)")
            # Copy to artifacts
            fname = os.path.basename(out_path)
            shutil.copyfile(out_path, os.path.join(ARTIFACT_DIR, fname))

        # Capture screenshots
        send_cmd("Emulation.setDeviceMetricsOverride", {
            "width": 1200,
            "height": 4500,
            "deviceScaleFactor": 1.2,
            "mobile": False
        })
        time.sleep(0.5)

        pages = send_cmd("Runtime.evaluate", {
            "expression": """
                (() => {
                    const els = document.querySelectorAll('.pdf-page');
                    return Array.from(els).map((el, i) => {
                        const rect = el.getBoundingClientRect();
                        return {
                            index: i + 1,
                            top: rect.top + window.scrollY,
                            left: rect.left + window.scrollX,
                            width: rect.width,
                            height: rect.height
                        };
                    });
                })()
            """,
            "returnByValue": True
        })

        page_rects = pages["result"]["result"]["value"]
        print(f"Capturing {len(page_rects)} pages for {screenshot_prefix}...")
        for pr in page_rects:
            clip_params = {
                "clip": {
                    "x": pr["left"],
                    "y": pr["top"],
                    "width": pr["width"],
                    "height": pr["height"],
                    "scale": 1.2
                }
            }
            shot = send_cmd("Page.captureScreenshot", clip_params)
            shot_data = base64.b64decode(shot["result"]["data"])
            page_shot_path = f"scratch/{screenshot_prefix}_page_{pr['index']}.png"
            with open(page_shot_path, "wb") as f:
                f.write(shot_data)
            print(f"Saved {page_shot_path}")
            shutil.copyfile(page_shot_path, os.path.join(ARTIFACT_DIR, f"{screenshot_prefix}_page_{pr['index']}.png"))

    finally:
        proc.terminate()
        try: shutil.rmtree(user_data, ignore_errors=True)
        except: pass

if __name__ == "__main__":
    print("=== RENDERING 1: CLASSIC TABLE ITINERARY ===")
    render_template(
        input_html="itinerary_classic.html",
        output_pdf_paths=[
            "SunBird_Lanka_Tours_Itinerary_Classic.pdf",
            "SunBird_Lanka_Tours_Itinerary.pdf"
        ],
        screenshot_prefix="itinerary_classic",
        port=9471
    )

    print("\n=== RENDERING 2: MODERN LUXURY ITINERARY ===")
    render_template(
        input_html="itinerary_modern.html",
        output_pdf_paths=[
            "SunBird_Lanka_Tours_Itinerary_Modern.pdf"
        ],
        screenshot_prefix="modern",
        port=9472
    )
    print("\nAll itineraries and screenshots rendered successfully!")
