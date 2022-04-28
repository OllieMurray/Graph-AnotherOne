import { near, JSONValue, json, ipfs, log } from "@graphprotocol/graph-ts";
import { Token, User } from "../generated/schema";

export function handleReceipt(receipt: near.ReceiptWithOutcome): void {
  const actions = receipt.receipt.actions;
  for (let i = 0; i < actions.length; i++) {
    handleAction(actions[i], receipt);
  }
}

function handleAction(
  action: near.ActionValue,
  receiptWithOutcome: near.ReceiptWithOutcome
): void {
  if (action.kind != near.ActionKind.FUNCTION_CALL) {
    return;
  }
  const outcome = receiptWithOutcome.outcome;
  const functionCall = action.toFunctionCall();
  const methodName = functionCall.methodName;

  if (
    methodName == "nft_mint_one" ||
    methodName == "nft_transfer" ||
    methodName == "nft_transfer_payout" ||
    methodName == "nft_mint_many" ||
    functionCall.methodName == "link_callback" ||
    functionCall.methodName == "nft_mint" ||
    functionCall.methodName == "mint_special" ||
    functionCall.methodName == "transfer_call" ||
    functionCall.methodName == "claim"
  ) {
    for (let logIndex = 0; logIndex < outcome.logs.length; logIndex++) {
      const outcomeLog = outcome.logs[logIndex].toString();

      log.info("outcomeLog {}", [outcomeLog]);

      const parsed = outcomeLog.replace("EVENT_JSON:", "");

      const jsonData = json.try_fromString(parsed);
      const jsonObject = jsonData.value.toObject();

      const eventData = jsonObject.get("data");
      const event = jsonObject.get("event");
      if (event) {
        if (event.toString() == "nft_mint") {
          if (eventData) {
            const eventArray: JSONValue[] = eventData.toArray();

            const data = eventArray[0].toObject();
            const tokenIds = data.get("token_ids");
            const owner_id = data.get("owner_id");
            if (!tokenIds || !owner_id) return;

            const ids: JSONValue[] = tokenIds.toArray();
            const tokenId = ids[0].toString();

            let token = Token.load(tokenId);

            if (!token) {
              token = new Token(tokenId);
              token.tokenId = tokenId;
            }

            token.ownerId = owner_id.toString();
            token.owner = owner_id.toString();

            let user = User.load(owner_id.toString());
            if (!user) {
              user = new User(owner_id.toString());
            }

            token.save();
            user.save();
          }
        } else if (event.toString() == "nft_transfer") {
          if (eventData) {
            const eventArray: JSONValue[] = eventData.toArray();
            const data = eventArray[0].toObject();
            const tokenIds = data.get("token_ids");
            const owner_id = data.get("new_owner_id");
            if (!tokenIds || !owner_id) return;
            const ids: JSONValue[] = tokenIds.toArray();
            const tokenId = ids[0].toString();
            let token = Token.load(tokenId);
            if (!token) {
              token = new Token(tokenId);
              token.tokenId = tokenId;
            }
            token.ownerId = owner_id.toString();
            token.owner = owner_id.toString();
            let user = User.load(owner_id.toString());
            if (!user) {
              user = new User(owner_id.toString());
            }
            token.save();
            user.save();
          }
        }
      }
    }
  }
}
