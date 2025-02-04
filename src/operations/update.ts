import { DynamoDB } from "aws-sdk";
import { usefulObjectMapper } from "../mappers/useful";
import { keyConstructor, KeyReducer } from "../reducers/key";
import { replaceConstructor, ReplaceReducer } from "../reducers/replace";
import { Operation, OperationProps } from "../types/operation";
import { fold } from "../common/fold";

export type UpdateReducers<Schema, PK extends keyof Schema, SK extends keyof Schema> = {
  key: KeyReducer<Schema, PK, SK>;
  replace: ReplaceReducer<Schema, PK, SK>;
};

export type UpdateOperation<Schema, PK extends keyof Schema, SK extends keyof Schema> = Operation<
  UpdateReducers<Schema, PK, SK>,
  DynamoDB.UpdateItemInput,
  Schema
>;

export function updateConstructor<Schema, PK extends keyof Schema, SK extends keyof Schema>(
  ...[client, name, option]: OperationProps
): UpdateOperation<Schema, PK, SK> {
  return async (reducers) => {
    const toDateString = option?.toDateString ?? ((value) => value.toISOString());

    const fromDateString = option?.fromDateString ?? ((value) => new Date(value));

    const key = keyConstructor<Schema, PK, SK>({ toDateString });

    const replace = replaceConstructor<Schema, PK, SK>({ toDateString });

    const input = reducers({
      key,
      replace,
    }).reduce(fold, {
      TableName: name,
      ReturnValues: "ALL_NEW",
    });

    const { Attributes } = await client.update(input).promise();

    return usefulObjectMapper(fromDateString)(Attributes);
  };
}
