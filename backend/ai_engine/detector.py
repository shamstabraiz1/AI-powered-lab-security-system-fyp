from ultralytics import YOLO
import cv2

# Load the YOLO model (downloads automatically the first time)
model = YOLO("yolov8m.pt")

# Replace with your phone's IP Webcam URL
camera_url = "http://192.168.100.41:8080/video"

cap = cv2.VideoCapture(camera_url)

if not cap.isOpened():
    print("Cannot connect to camera.")
    exit()

while True:
    success, frame = cap.read()

    if not success:
        print("Failed to receive frame.")
        break

    # Run YOLO
    results = model(frame)

    # Draw detections
    annotated_frame = results[0].plot()

    cv2.imshow("Lab Security AI", annotated_frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()