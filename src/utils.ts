export const random = (array: any[]) => array[Math.floor(Math.random() * array.length)];

export const weightedRandom = (array: any[]) => {
    let i;

    const weights = [array[0].weight ?? 1];

    for (i = 1; i < array.length; i++)
        weights[i] = (array[i].weight ?? 1) + weights[i - 1];
    
    const random = Math.random() * weights[weights.length - 1];
    
    for (i = 0; i < weights.length; i++)
        if (weights[i] > random)
            break;
    
    return array[i];
}

export const shuffleArray = (array: any[]) => {
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }

    return array;
}

export const randomInteger = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const wait = (ms: number) => new Promise(res => setTimeout(res, ms));