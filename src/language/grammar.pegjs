{
    function parseOperationList(head, tail) {
        return tail.reduce((left, element) => ({
            type: "operation",
            left,
            operator: element[1],
            right: element[3]
        }), head)
    }

    function parseRightAssociativeOperationList(head, tail) {
        if (tail.length === 0) {
            return head
        } else {
            return {
                type: "operation",
                left: head,
                operator: tail[0][1],
                right: parseRightAssociativeOperationList(tail[0][3], tail.slice(1))
            }
        }
    }
}

Program = ProgramRoot
ProgramRoot = __ body:Statements? __ { return { type: "program", body: body ?? [] } }

Statements = head:Statement _ tail:(Separator _ Statement _ )* {
    return [head].concat(tail.map(child => child[2]))
}

// statements carry their location so runtime errors can point at them
Statement = statement:(Assignment / WhileBlock / ForBlock / Command / IfBlock / FunctionDefinition / ReturnStatement / Expression) { return { ...statement, location: location() } }
ReturnStatement = "return" KeywordEnd _ expression:Expression { return { type: "return", expression } }

Assignment = left:Identifier _ "=" _ right:Expression { return { type: "assignment", left, right } }
WhileBlock = "while" KeywordEnd _ condition:BooleanExpression __ body:Block { return { type: "while", condition, body } }
ForBlock = "for" KeywordEnd _ variable:Identifier _ "in" KeywordEnd _ range:RangeExpression __ body:Block { return { type: "for", variable, range, body } }
IfBlock = "if" KeywordEnd _ condition:BooleanExpression __ body:Block elseBody:(__ @ElseBlock)? { return { type: "if", condition, body, else: elseBody ?? null } }
ElseBlock = "else" KeywordEnd __ body:Block { return body }
    / "else" KeywordEnd _ elseIf:IfBlock { return [elseIf] }
FunctionDefinition = "function" KeywordEnd _ name:Identifier _ "(" __ parameters:FunctionParameters? __ ")" __ body:Block { return { type: "functionDefinition", name: name.name, parameters: parameters ?? [], body } }
FunctionParameters = head:Identifier tail:(__ "," __ Identifier)* { return [head].concat(tail.map(child => child[3])) }
Block = "{" __ body:Statements? __ "}" { return body ?? [] }

Expression = BooleanExpression / ArithmeticExpression
RangeExpression = start:ArithmeticExpression _ ".." _ end:ArithmeticExpression { return [start, end] }

FunctionCall = name:Identifier _ "(" __ functionArguments:FunctionArguments? __ ")" { return { type: "functionCall", name: name.name, arguments: functionArguments ?? [], location: location() } }
FunctionArguments = head:Expression tail:(__ "," __ Expression)* { return [head].concat(tail.map(child => child[3])) }

ArithmeticExpression = AdditionExpression / ParenthesizedExpression
AdditionExpression = head:MultiplicationExpression tail:(_ operator:("+"/"-") _ right:MultiplicationExpression)* { return parseOperationList(head, tail) }
MultiplicationExpression = head:ExponentiationExpression tail:(_ operator:("*"/"/"/"%") _ right:ExponentiationExpression)* { return parseOperationList(head, tail) }
ExponentiationExpression = head:NumericExpression tail:(_ operator:"^" _ right:NumericExpression)* { return parseRightAssociativeOperationList(head, tail) }
NumericExpression = Number / FunctionCall / Identifier / ParenthesizedExpression / MinusExpression
ParenthesizedExpression = "(" _ expression: ArithmeticExpression _ ")" { return expression }
MinusExpression = "-" _ expression:NumericExpression { return { type: "unaryOperation", left: expression, operator: "-" } }


BooleanExpression = OrExpression / ParenthesizedBooleanExpression
OrExpression = head:AndExpression tail:(_ operator:"|" _ right:AndExpression)* { return parseOperationList(head, tail) }
AndExpression = head:UnaryExpression tail:(_ operator:"&" _ right:UnaryExpression)* { return parseOperationList(head, tail) }
UnaryExpression = ComparisonEqExpression / NotExpression / ParenthesizedBooleanExpression
NotExpression = "!" _ expression:BooleanExpression { return { type: "unaryOperation", left: expression, operator: "!" } }
ParenthesizedBooleanExpression = "(" _ expression:BooleanExpression _ ")" { return expression }
ComparisonEqExpression = head:ArithmeticExpression tail:(_ operator:("=="/"!="/">="/"<="/"<"/">") _ ArithmeticExpression)+ { return parseOperationList(head, tail) }

Command = ForwardCommand
    / RotateCommand
    / PlaceAtCommand
    / CursorCommand
    / BreadcrumbCommand

ForwardCommand = "forward" KeywordEnd _ distance:ArithmeticExpression { return { type: "command", command: "forward", distance } }
RotateCommand = "rotate" KeywordEnd _ angle:ArithmeticExpression _ unit:("deg" / "rad") KeywordEnd { return { type: "command", command: "rotate", angle, unit } }
PlaceAtCommand = "place" KeywordEnd _ x:ArithmeticExpression _ "," _ y:ArithmeticExpression { return { type: "command", command: "place", x, y } }
CursorCommand = "cursor" KeywordEnd _ state:("on" / "off") KeywordEnd { return { type: "command", command: "cursor", state } }
BreadcrumbCommand = "breadcrumb" KeywordEnd _ action:("push" / "pop") KeywordEnd { return { type: "command", command: "breadcrumb", action } }



Identifier = name:$([A-Za-z_] IdentifierChar*) { return { type: "identifier", name, location: location() } }
IdentifierChar = [A-Za-z0-9_]
// keywords must not run into a name, so forward_line(3) is a call rather than "forward _line(3)"
KeywordEnd = !IdentifierChar

Number = value:$(Sign? (DigitSequence DecimalPart? / DecimalPart)) { return { type: "number", value: parseFloat(value) } }
Sign = "+" / "-"
DecimalPart = "." DigitSequence
DigitSequence = [0-9]+

// BooleanConstant = "true" / "false" { return { type: "boolean", value: text === "true" } }

Separator "separator" = [\n\r] __

Comment "comment" = "//" [^\n\r]*

_ "whitespace" = ([ \t] / Comment)* { return "" }
__ "lwhitespace" = ([ \t\n\r] / Comment)* { return "" }
