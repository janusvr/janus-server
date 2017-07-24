function middleware(data, tasks, cb) {
    function iterate(idx) {
        if (idx === tasks.length && typeof cb === "function") 
            return cb();
        const task = tasks[idx];
        task(data, () =>  { 
            iterate(idx + 1) 
        });  
    }
    return iterate(0);
}

module.exports = middleware;
