import json
from src.rabbitmq.connection import get_channel

def send_message(queue_name , message):
    # Sends a message to the specified RabbitMQ queue
    channel = get_channel()
    # Declare the queue
    channel.queue_declare(queue = queue_name)
    # Publish the message
    channel.basic_publish(
        exchange = '' ,
        routing_key = queue_name ,
        body = json.dumps(message)
    )
    print(f"Sent message to queue '{queue_name}': {message}")
    channel.close()