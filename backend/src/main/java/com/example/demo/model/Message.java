package com.example.demo.model;

public class Message {

    private String text;

    private String source;

    private long timestamp;

    public Message() {
    }

    public Message(String text, String source, long timestamp) {
        this.text = text;
        this.source = source;
        this.timestamp = timestamp;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }
}
