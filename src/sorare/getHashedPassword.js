// {"salt":"$2a$11$NKdWTSrsBXQIXxgYR17wQu"}
/*
{
    "data": {
        "signIn": {
            "currentUser": {
                "slug": "clementh59",
                "jwtToken": {
                    "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI0NzE2NGUxMS0xZjRiLTRmOGItYmQxNC0zMzU2ZWFiN2JhMjMiLCJzY3AiOiJ1c2VyIiwiYXVkIjoiUlBJX0JPVCIsImlhdCI6MTY0NjI1NzQ4NywiZXhwIjoiMTY3NzgxNDQzOSIsImp0aSI6IjJjODdjOGFiLThmMDAtNGY0MS1iZDhhLTI1YTEzMTdjYzJkOSJ9.BP9s3DpNJA-NA4HMMbNV2kkLFTzaumLAABfs-U6CYrA",
                    "expiredAt": "2023-03-03T03:33:59Z"
                }
            },
            "errors": []
        }
    }
}
 */
import bcrypt from "bcryptjs";

const salt = "$2a$11$NKdWTSrsBXQIXxgYR17wQu";
const pwd = "Wir5@%#x*b5TOiL0LzjX$C#4OxBiWhq294yE&o%Y";

const hashedPassword = bcrypt.hashSync(pwd, salt);