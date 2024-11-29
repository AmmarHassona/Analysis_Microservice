import pika

def get_connection():
    # Establishes a connection to RabbitMQ
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(host = 'localhost')
    )
    return connection

def get_channel():
    # Creates and returns a channel
    connection = get_connection()
    channel = connection.channel()
    return channel