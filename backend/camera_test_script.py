import cv2

url = "http://192.168.100.41:8080/video"

cap = cv2.VideoCapture(url)

if not cap.isOpened():
    print("Cannot connect")
    exit()

ret, frame = cap.read()

if ret:
    cv2.imshow("Frame", frame)
    cv2.waitKey(0)
    cv2.imwrite("test.jpg", frame)
    print("Frame Saved")
else:
    print("Frame Not Captured")

cap.release()
cv2.destroyAllWindows()