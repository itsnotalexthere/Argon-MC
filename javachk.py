import psutil
import time

def monitor_javaw_process():
    """
    Monitor processes for javaw.exe and log their details.
    """
    print("Monitoring for javaw.exe processes. Press Ctrl+C to stop.")
    try:
        while True:
            # Fetch all running processes
            for proc in psutil.process_iter(['pid', 'name']):
                try:
                    # Check if the process name matches javaw.exe
                    if proc.info['name'].lower == 'javaw.exe':
                        print(f"Found javaw.exe - PID: {proc.info['pid']}, User: {proc.info['username']}")
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    print(f"{datetime.now()} - No process found.")
    except KeyboardInterrupt:
        print("Monitoring stopped.")

if __name__ == "__main__":
    monitor_javaw_process()