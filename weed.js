// lsys like (X → F+[[X]-X]-F[-FX]+X), (F → FF)

function expandLSystem(input, replacementRules, iteration) {
    if (iteration === 0) {
        return input;
    }
    const output = input.split('').reduce((acc, char) => {
        if (replacementRules[char]) {
            return acc + replacementRules[char];
        } else {
            return acc + char;
        }
    } , '');
    return expandLSystem(output, replacementRules, iteration - 1);
}

function LSystemToPlumetoScript(input){
    return input.replace(/F/g, 'forward 10\n')
        .replace(/\+/g, 'rotate 25 deg\n')
        .replace(/-/g, 'rotate -25 deg\n')
        .replace(/\[/g, 'breadcrumb push\n')
        .replace(/\]/g, 'breadcrumb pop\n')
        .replace(/X/g, '');
}

const lSystem = expandLSystem('X', {
    X: 'F+[[X]-X]-F[-FX]+X',
    F: 'FF'
    }, 4);
const script = LSystemToPlumetoScript(lSystem);


console.log(script)
