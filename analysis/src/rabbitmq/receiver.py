import json
from src.rabbitmq.connection import get_channel

def on_message(channel , method , properties , body):
    # Callback function to handle received messages
    message = json.loads(body)
    print(f"Received message: {message}")
    # Process the message 

    # (implement logic here)

    # Acknowledge the message
    channel.basic_ack(delivery_tag = method.delivery_tag)

def start_consuming(queue_name):
    # Starts consuming messages from the specified queue
    channel = get_channel()
    # Declare the queue
    channel.queue_declare(queue = queue_name)
    # Start consuming messages
    channel.basic_consume(queue = queue_name , on_message_callback = on_message)
    print(f"Waiting for messages in queue '{queue_name}'...")
    channel.start_consuming()