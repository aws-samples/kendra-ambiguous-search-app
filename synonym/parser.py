# Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/
import urllib.parse
from typing import List, Dict
import collections
import boto3


TABLE_NAME, DDB_PRIMARY_KEY, DDB_ATTRIBUTES_NAME = "kendra-synonym", "keyword", "synonym"
DDB_TABLE = boto3.resource('dynamodb').Table(TABLE_NAME)
S3 = boto3.client('s3')
BUCKET_NAME = "バケット名"
S3_KEY_NAME = "thesaurus/synonym"


def download_synonym_file() -> List[str]:
    """
    S3 からのファイルダウンロード
    """
    return S3.get_object(Bucket=BUCKET_NAME, Key=S3_KEY_NAME)['Body'].read().decode('utf-8').split('\n')


def read_synonym_file() -> List[str]:
    """
    シソーラスファイルを読み込み
    """
    FILE_PATH = "synonym"
    with open(FILE_PATH) as f:
        l = f.readlines()
    return l


def cleansing(synonyms: List[str]) -> List[str]:
    """
    シソーラスファイルからコメント行を排除
    """
    clean_synonym = []
    for s in synonyms:
        if s.strip() and s.strip()[0] != '#':
            clean_synonym.append(s.strip())
    return clean_synonym


def insert_synonyms(synonyms: List[Dict[str, List[str]]]):
    """
    DynamoDB にシノニムを追加
    """
    try:
        with DDB_TABLE.batch_writer() as batch:
            for s in synonyms:
                for k, v in s.items():
                    batch.put_item(
                        Item={
                            DDB_PRIMARY_KEY: k,
                            DDB_ATTRIBUTES_NAME: v
                        }
                    )
    except Exception as error:
        raise error


def delete_synonyms():
    """
    DynamoDBの中身を全消去
    """
    delete_items = []
    parameters = {}

    # DynamoDBをscan
    while True:
        response = DDB_TABLE.scan(**parameters)
        delete_items.extend(response["Items"])
        if ("LastEvaluatedKey" in response):
            parameters["ExclusiveStartKey"] = response["LastEvaluatedKey"]
        else:
            break

    # データ削除
    delete_keys = [{k: v for k, v in x.items() if k in DDB_PRIMARY_KEY}
                   for x in delete_items]
    with DDB_TABLE.batch_writer() as batch:
        for key in delete_keys:
            batch.delete_item(Key=key)


def lambda_handler(event, context):
    print("==== start ====")
    # csv fileを取得
    BUCKET_NAME = event['Records'][0]['s3']['bucket']['name']
    S3_KEY_NAME = urllib.parse.unquote_plus(
        event['Records'][0]['s3']['object']['key'], encoding='utf-8')
    synonym_list = []
    tokens = []

    # 不要な行を削除
    for s in cleansing(download_synonym_file()):
        # 単方向シノニムか双方向シノニムかの判定
        if '=>' in s:  # 双方向シノニムの場合
            if len(s.split('=>')) == 2:
                # 左側のトークンと右側の用語に分割
                token_str, word_str = s.split('=>')
                token_list = set([ts.strip() for ts in token_str.split(',')])
                word_list = set([ws.strip() for ws in word_str.split(',')])

                for tl in token_list:
                    synonym_list.append({tl: [wl for wl in word_list]})
                    tokens.append(tl)
            else:
                raise ValueError("Invalid Input: 矢印の個数が合いません")
        else:  # 単方向シノニムの場合
            # カンマで分割
            token_list = set([ts.strip() for ts in s.split(',')])

            for tl_i, tl in enumerate(token_list):
                synonym_list.append(
                    {tl: [wl for wl_i, wl in enumerate(token_list) if tl_i != wl_i]})
                tokens.append(tl)

    # トークンが重複している場合、エラー
    if len([k for k, v in collections.Counter(tokens).items() if v > 1]) > 0:
        raise ValueError("Invalid Input: 重複するトークンがあります")

    # DynamoDBの中身を全消去
    delete_synonyms()

    # DynamoDBへの書き込み
    insert_synonyms(synonym_list)

    print("==== success ====")