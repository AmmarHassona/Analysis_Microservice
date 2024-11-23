import pymongo
import pandas as pd

client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client['analysis']
collection = db['spending_data']

def view_data():
    records = collection.find().limit(5)
    
    records_list = list(records)
    
    df = pd.DataFrame(records_list)
    
    df = df.drop(columns = ['_id'])
    
    print(df)

if __name__ == "__main__":
    view_data()