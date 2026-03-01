import os

# Global flag to track if torch is safely loaded
_TORCH_LOADED = False
_TORCH_ERROR = None

def _try_import_torch():
    global _TORCH_LOADED, _TORCH_ERROR
    if _TORCH_LOADED: return True
    try:
        import torch
        import torch.nn as nn
        import torch.optim as optim
        _TORCH_LOADED = True
        return True
    except Exception as e:
        _TORCH_ERROR = str(e)
        return False

def get_anomaly_detector_class():
    if not _try_import_torch():
        return None
    
    import torch.nn as nn
    import torch

    class MuleAnomalyDetector(nn.Module):
        """
        Authentic ML Binary Classifier for Money Muling Detection.
        Optimized for AMD hardware accelerators (Instinct series) via ROCm/PyTorch.
        """
        def __init__(self, input_size=9):
            super(MuleAnomalyDetector, self).__init__()
            self.network = nn.Sequential(
                nn.Linear(input_size, 64),
                nn.ReLU(),
                nn.Dropout(0.2),
                nn.Linear(64, 32),
                nn.ReLU(),
                nn.Linear(32, 1),
                nn.Sigmoid()
            )
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            self.to(self.device)

        def forward(self, x):
            return self.network(x)

        def predict_batch(self, features_tensor):
            with torch.no_grad():
                self.eval()
                features_tensor = features_tensor.to(self.device)
                return self.forward(features_tensor)
    
    return MuleAnomalyDetector

def save_model(model, path="backend/weights.pth"):
    import torch
    torch.save(model.state_dict(), path)

def load_model(input_size=9, path="backend/weights.pth"):
    DetectorClass = get_anomaly_detector_class()
    if not DetectorClass:
        print(f"ML Model unavailable: {_TORCH_ERROR}")
        return None
    
    import torch
    model = DetectorClass(input_size=input_size)
    if os.path.exists(path):
        try:
            model.load_state_dict(torch.load(path, map_location=model.device))
        except Exception as e:
            print(f"Error loading weights: {e}")
    return model

def train_on_synthetic(model, num_epochs=50):
    if not _try_import_torch(): return
    import torch
    import torch.nn as nn
    import torch.optim as optim

    criterion = nn.BCELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    num_samples = 1000
    X = torch.randn(num_samples, 9)
    y = ((X[:, 0] > 0.5) & (X[:, 6] > 0.5)).float().view(-1, 1)
    
    X, y = X.to(model.device), y.to(model.device)
    
    model.train()
    for epoch in range(num_epochs):
        optimizer.zero_grad()
        outputs = model(X)
        loss = criterion(outputs, y)
        loss.backward()
        optimizer.step()
    
    save_model(model)
    print(f"Model trained and saved to backend/weights.pth (Loss: {loss.item():.4f})")
