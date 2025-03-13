import struct
import pickle
import json


class PhysicalLayer:
    def send(self, data):
        print(f"[Physical] Sending raw binary data: {data}")  # Directly send binary data
        return data 

    def receive(self, data):
        print(f"[Physical] Received raw binary data: {data}")  
        return data  # Directly return binary data


class DataLinkLayer:
    def send(self, data):
        frame = b"MAC_HEADER:" + data  # Ensure bytes
        print(f"[Data Link] Framed Data: {frame}")
        return frame

    def receive(self, data):
        stripped = data.replace(b"MAC_HEADER:", b"")  # Ensure bytes
        print(f"[Data Link] Stripped Data: {stripped}")
        return stripped

class NetworkLayer:
    def send(self, data):
        packet = b"IP_HEADER:192.168.1.1->" + data  # Ensure bytes
        print(f"[Network] Routed Packet: {packet}")
        return packet
    
    def receive(self, data):
        stripped = data.split(b"->", 1)[-1]  # Ensure bytes are handled properly
        print(f"[Network] Stripped Packet: {stripped}")
        return stripped

class TransportLayer:
    def send(self, data):
        segment = struct.pack("!I", 1) + data  # `data` is already bytes, no need to encode
        print(f"[Transport] Segment Data: {segment}")
        return segment
    
    def receive(self, data):
        seq = struct.unpack("!I", data[:4])[0]
        stripped = data[4:] if isinstance(data, bytes) else data[4:].encode()
        print(f"[Transport] Reassembled Data (SEQ {seq}): {stripped}")
        return stripped

class SessionLayer:
    def send(self, data):
        session_data = json.dumps({"session": "open", "data": data.hex()}).encode()  # Convert to bytes
        print(f"[Session] Session Opened: {session_data}")
        return session_data  # Ensure bytes are returned

    def receive(self, data):
        json_data = json.loads(data.decode())  # Convert JSON bytes to dictionary
        stripped = bytes.fromhex(json_data["data"])  # Convert hex string to bytes
        print(f"[Session] Session Data: {stripped}")
        return stripped  # Ensure bytes are returned

class PresentationLayer:
    def send(self, data):
        encoded = pickle.dumps(data) #serialize data (mock encryption)
        print(f"[Presentation] Encoded Data: {encoded}")
        return encoded
    
    def receive(self, data):
        decoded = pickle.loads(data) #deserialize data
        print(f"[Presentation] Decoded Data: {decoded}")
        return decoded

class ApplicationLayer:
    def send(self, data):
        request = f"HTTP_REQUEST:{data}"  # Mock HTTP request
        print(f"[Application] Sending Request: {request}")
        return request

    def receive(self, data):
        response = data.replace("HTTP_REQUEST:", "HTTP_RESPONSE:")
        print(f"[Application] Sending Response: {response}")
        return response


# Instantiate all layers
app_layer = ApplicationLayer()
pres_layer = PresentationLayer()
sess_layer = SessionLayer()
trans_layer = TransportLayer()
net_layer = NetworkLayer()
data_layer = DataLinkLayer()
phys_layer = PhysicalLayer()

# Get user input
data = input("Enter message to send: ")

# Simulate sending data
print("\n--- SENDING DATA ---")
app_data = app_layer.send(data)
pres_data = pres_layer.send(app_data)
sess_data = sess_layer.send(pres_data)
trans_data = trans_layer.send(sess_data)
net_data = net_layer.send(trans_data)
data_data = data_layer.send(net_data)
phys_data = phys_layer.send(data_data)

# Simulate receiving data
print("\n--- RECEIVING DATA ---")
data_received = phys_layer.receive(phys_data)
data_received = data_layer.receive(data_received)
data_received = net_layer.receive(data_received)
data_received = trans_layer.receive(data_received)
data_received = sess_layer.receive(data_received)
data_received = pres_layer.receive(data_received)
data_received = app_layer.receive(data_received)
