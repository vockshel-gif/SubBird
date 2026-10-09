import os
import sys
import uuid
import shutil
import subprocess
import webbrowser

# Ensure Windows console supports UTF-8 characters safely
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

REPO_OWNER = "vockshel-gif"
REPO_NAME = "SubBird"
GITHUB_PAGES_BASE = f"https://{REPO_OWNER}.github.io/{REPO_NAME}/view.html?id="

def copy_to_clipboard(text):
    try:
        # Use Windows PowerShell Set-Clipboard
        cmd = f'Set-Clipboard -Value "{text}"'
        subprocess.run(["powershell", "-NoProfile", "-Command", cmd], check=True)
        return True
    except Exception:
        return False

def select_file_gui():
    try:
        import tkinter as tk
        from tkinter import filedialog
        root = tk.Tk()
        root.withdraw()
        root.attributes('-topmost', True)
        file_path = filedialog.askopenfilename(
            title="Select Any Tour PDF to Publish & Generate Link",
            filetypes=[("PDF Documents", "*.pdf"), ("All Files", "*.*")]
        )
        root.destroy()
        return file_path
    except Exception:
        return None

def main():
    print("=" * 65)
    print("  SUNBIRD LANKA TOURS - 1-CLICK ITINERARY LINK GENERATOR")
    print("  Hosted via GitHub Pages | Zero Firebase | Private & Secure")
    print("=" * 65)

    input_pdf = None
    if len(sys.argv) > 1 and os.path.isfile(sys.argv[1]):
        input_pdf = os.path.abspath(sys.argv[1])
    else:
        print("\n[?] No file specified. Opening file chooser...")
        input_pdf = select_file_gui()

    # Fallback to default classic itinerary in directory if available
    if not input_pdf or not os.path.isfile(input_pdf):
        default_candidate = "SunBird_Lanka_Tours_Itinerary_Classic.pdf"
        if os.path.isfile(default_candidate):
            print(f"[*] No file chosen. Using workspace default: {default_candidate}")
            input_pdf = os.path.abspath(default_candidate)
        else:
            print("[X] No PDF selected. Operation cancelled.")
            sys.exit(1)

    print(f"\n[+] Source File: {input_pdf}")

    # Generate secure, unguessable UUID4
    doc_id = str(uuid.uuid4())
    print(f"[+] Generated Private Security Token: {doc_id}")

    # Target directory and destination
    base_dir = os.path.dirname(os.path.abspath(__file__))
    itineraries_dir = os.path.join(base_dir, "itineraries")
    os.makedirs(itineraries_dir, exist_ok=True)
    target_pdf = os.path.join(itineraries_dir, f"{doc_id}.pdf")

    # Copy the PDF file
    shutil.copyfile(input_pdf, target_pdf)
    file_size_kb = os.path.getsize(target_pdf) / 1024
    print(f"[+] Saved to: itineraries/{doc_id}.pdf ({file_size_kb:.1f} KB)")

    # Client link
    client_link = f"{GITHUB_PAGES_BASE}{doc_id}"

    # Git commit and push
    print("\n[*] Pushing to GitHub repository...")
    try:
        subprocess.run(["git", "add", f"itineraries/{doc_id}.pdf", "itineraries/index.html", "view.html", "itinerary-builder.html"], cwd=base_dir, check=True)
        commit_msg = f"Publish tour itinerary asset [ref: {doc_id[:8]}]"
        subprocess.run(["git", "commit", "-m", commit_msg], cwd=base_dir, check=True)
        print("[*] Uploading to GitHub (git push origin main)...")
        push_res = subprocess.run(["git", "push", "origin", "main"], cwd=base_dir, capture_output=True, text=True)
        if push_res.returncode == 0:
            print("[OK] Successfully pushed to GitHub!")
        else:
            print("[!] Git push note:", push_res.stderr.strip() or push_res.stdout.strip())
            print("    (If offline, you can push later with 'git push origin main')")
    except Exception as e:
        print(f"[!] Git note: {e}")
        print("    File has been saved locally. You can push manually with 'git push origin main'.")

    # Copy to clipboard
    copied = copy_to_clipboard(client_link)

    print("\n" + "=" * 65)
    print("SUCCESS: CLIENT ITINERARY LINK IS READY!")
    print(f"\nLive Link:\n  {client_link}\n")
    if copied:
        print("[*] Link has been AUTOMATICALLY COPIED to your Windows Clipboard!")
        print("    (Press Ctrl + V in WhatsApp, Email, or Messages)")
    print("=" * 65)

    # Local preview
    local_preview = f"file:///{os.path.join(base_dir, 'view.html').replace(os.sep, '/')}?id={doc_id}"
    print(f"\n[*] Opening local preview in browser...")
    try:
        webbrowser.open(local_preview)
    except Exception:
        pass

if __name__ == "__main__":
    main()
