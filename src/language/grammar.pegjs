{
    function parseOperationList(head, tail) {
        if (tail.length === 0) {
            return head
        } else {
            return {
                type: "operation",
                left: head,
                operator: tail[0][1],
                right: parseOperationList(tail[0][3], tail.slice(1))
            }
        }
        
    }
}

Program = ProgramRoot
ProgramRoot = __ body:Statements __ { return { type: "program", body } }

Statements = head:Statement _ tail:(Separator _ Statement _ )* {
    return [head].concat(tail.map(child => child[2]))
}

Statement = Assignment / WhileBlock / ForBlock / Command / IfBlock / FunctionDefinition / Expression
FunctionStatements = ReturnStatement / Statements
ReturnStatement = "return" _ expression:Expression { return { type: "return", expression } }

Assignment = left:Identifier _ "=" _ right:Expression { return { type: "assignment", left, right } }
WhileBlock = "while" _ condition:BooleanExpression _ "{" __ body:Statements __ "}" { return { type: "while", condition, body } }
ForBlock = "for" _ variable:Identifier _ "in" _ range:RangeExpression _ "{" __ body:Statements __ "}" { return { type: "for", variable, range, body } }
IfBlock = "if" _ condition:BooleanExpression _ "{" __ body:Statements __ "}" _ elseBody:ElseBlock? { return { type: "if", condition, body, else: elseBody ?? null } }
ElseBlock = "else" _ "{" __ body:Statements __ "}" { return body }
FunctionDefinition = "function" _ name:Identifier _ "(" _ parameters:FunctionParameters _ ")" _ "{" __ body:FunctionStatements __ "}" { return { type: "functionDefinition", name: name.name, parameters, body } }
FunctionParameters = head:Identifier tail:(_ "," _ Identifier _ )* { return [head].concat(tail.map(child => child[3])) }

Expression = FunctionCall / BooleanExpression / ArithmeticExpression
RangeExpression = start:ArithmeticExpression _ ".." _ end:ArithmeticExpression { return [start, end] }

FunctionCall = name:Identifier _ "(" _  functionArguments:FunctionArguments _ ")" { return { type: "functionCall", name: name.name, arguments: functionArguments } }
FunctionArguments = head:Expression tail:(_ "," _ Expression _ )* { return [head].concat(tail.map(child => child[3])) }

ArithmeticExpression = AdditionExpression / ParenthesizedExpression
AdditionExpression = head:MultiplicationExpression tail:(_ operator:("+"/"-") _ right:MultiplicationExpression)* { return parseOperationList(head, tail) }
MultiplicationExpression = head:ExponentiationExpression tail:(_ operator:("*"/"/"/"%") _ right:ExponentiationExpression)* { return parseOperationList(head, tail) }
ExponentiationExpression = head:NumericExpression tail:(_ operator:"^" _ right:NumericExpression)* { return parseOperationList(head, tail) }
NumericExpression = Number / Identifier / ParenthesizedExpression / MinusExpression / FunctionCall
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

ForwardCommand = "forward" _ distance:ArithmeticExpression { return { type: "command", command: "forward", distance } }
RotateCommand = "rotate" _ angle:ArithmeticExpression _ unit:("deg" / "rad") { return { type: "command", command: "rotate", angle, unit } }
PlaceAtCommand = "place" _ x:ArithmeticExpression _ "," _ y:ArithmeticExpression { return { type: "command", command: "place", x, y } }
CursorCommand = "cursor" _ state:("on" / "off") { return { type: "command", command: "cursor", state } }
BreadcrumbCommand = "breadcrumb" _ action:("push" / "pop") { return { type: "command", command: "breadcrumb", action } }



Identifier = word:[A-Za-z_]+ { return { type: "identifier", name: word.join("") } }

Number = sign:Sign? int:DigitSequence decimal:DecimalPart? { return { type: "number", value: parseFloat((sign ?? "") + int + decimal, 10) } }
Sign = "+" / "-"
DecimalPart = "." digits:DigitSequence { return "." + digits }
DigitSequence = digits:[0-9]+ { return digits.join("") }

// BooleanConstant = "true" / "false" { return { type: "boolean", value: text === "true" } }

Separator "separator" = [\n\r]+

_ "whitespace" = [ \t]* { return "" }
__ "lwhitespace" = [ \t\n\r]* { return "" }
