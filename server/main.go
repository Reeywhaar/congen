package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

func main() {
	port := flag.Int("port", 8080, "port to listen on")
	root := flag.String("dir", "build/frontend", "directory to serve")
	flag.Parse()

	absRoot, err := filepath.Abs(*root)
	if err != nil {
		log.Fatalf("resolve path: %v", err)
	}

	info, err := os.Stat(absRoot)
	if err != nil {
		log.Fatalf("cannot access %q: %v", absRoot, err)
	}
	if !info.IsDir() {
		log.Fatalf("%q is not a directory", absRoot)
	}

	fs := http.FileServer(http.Dir(absRoot))
	mux := http.NewServeMux()
	mux.Handle("/", loggingMiddleware(fs))

	addr := fmt.Sprintf(":%d", *port)
	log.Printf("Serving %s on http://localhost%s", absRoot, addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s (%s)", r.Method, r.URL.Path, time.Since(start).Truncate(time.Millisecond))
	})
}
