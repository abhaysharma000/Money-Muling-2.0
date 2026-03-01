from ml_model import MuleAnomalyDetector, train_on_synthetic

if __name__ == "__main__":
    print("Initial Mapping: Synchronizing Neural Fabric with Device...")
    model = MuleAnomalyDetector()
    print(f"Device Discovery: {model.device} detected.")
    
    print("Executing Synthetic Pre-training...")
    train_on_synthetic(model, num_epochs=100)
    print("MULE TRACE X: Neural Engine is now PRIMED and ready for authentic forensic analysis.")
