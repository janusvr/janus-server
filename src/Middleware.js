function middleware(data, tasks, cb) {
    function iterate(idx) {
        if (idx === tasks.length) 
            return typeof(cb) === "function" ? cb() : undefined;
        const task = tasks[idx];
        task(data, () =>  { 
            iterate(idx + 1) 
        });  
    }
    return iterate(0);
}

module.exports = middleware;
