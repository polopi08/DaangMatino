// Quick Sort draft onliii 
function quickSort(array, low = 0, high = array.length - 1, compareFunction, steps = []) {

    if (low < high) {
        const partitionIndex = partition(array, low, high, compareFunction, steps);
        quickSort(array, low, partitionIndex - 1, compareFunction, steps);
        quickSort(array, partitionIndex + 1, high, compareFunction, steps);
    }

    return { sorted: array, steps: steps };

}

function partition(array, low, high, compareFunction, steps) {

    const pivot = array[high];
    let i = low - 1;

    steps.push({
        action: `Partitioning with pivot: ${pivot.name} (${pivot.distance.toFixed(3)} km)`,
        array: [...array],
        pivotIndex: high,
        lowIndex: low,
        highIndex: high
    });

    for (let j = low; j < high; j++) {
        if (compareFunction(array[j], pivot) <= 0) {
            i++;
            [array[i], array[j]] = [array[j], array[i]];
            steps.push({
                action: `Swapped ${array[i].name} with ${array[j].name}`,
                array: [...array],
                swapped: [i, j]
            });
        }
    }

    [array[i + 1], array[high]] = [array[high], array[i + 1]];
    steps.push({
        action: `Placed pivot ${pivot.name} at position ${i + 1}`,
        array: [...array],
        pivotFinal: i + 1
    });

    return i + 1;

}